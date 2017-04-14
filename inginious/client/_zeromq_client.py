# -*- coding: utf-8 -*-
#
# This file is part of INGInious. See the LICENSE and the COPYRIGHTS files for
# more information about the licensing of this file.
import abc
import asyncio

import zmq

from inginious.common.message_meta import ZMQUtils
from inginious.common.messages import Pong, Ping, Unknown


class BetterParanoidPirateClient(object, metaclass=abc.ABCMeta):
    """
    A Client that uses transactions, ping-pong and registration.
    Remote server must handle the message Ping, and should immediately answer with a Pong. The remote server can also return Unknown in order to make
    the client restart and register again.

    Free adaptation of http://zguide.zeromq.org/php:chapter4#Robust-Reliable-Queuing-Paranoid-Pirate-Pattern

    See also https://www.youtube.com/watch?v=SLMJpHihykI
    """

    def __init__(self, context, router_addr):
        self._context = context
        self._router_addr = router_addr
        self._socket = self._context.socket(zmq.DEALER)
        self._socket.ipv6 = True
        self._loop = asyncio.get_event_loop()

        self._msgs_registered = {}
        self._msgs_registered_inv = {}
        self._handlers_registered = {Pong.__msgtype__: self._handle_pong, Unknown.__msgtype__: self._handle_unknown}  # pylint: disable=no-member
        self._transactions = {}

        self._restartable_tasks = [] # a list of asyncio task that should be closed each time the client restarts

        self._ping_count = 0

    def _register_handler(self, recv_msg, coroutine_recv):
        """
        Register a coroutine that will be called, in the event loop, when a particular class `recv_msg` is received, with the message as arg
        :param recv_msg:
        :param coroutine_recv:
        """
        self._handlers_registered[recv_msg.__msgtype__] = coroutine_recv

    def _register_transaction(self, send_msg, recv_msg, coroutine_recv, coroutine_abrt, get_key=None, inter_msg=None):
        """
        Register a type of message to be sent.
        After this message has been sent, if the answer is received, callback_recv is called.
        If the remote server becomes dones, calls callback_abrt.

        :param send_msg: class of message to be sent
        :param recv_msg: message that the server should send in response
        :param get_key: receive a `send_msg` or `recv_msg` as input, and returns the "key" (global identifier) of the message
        :param coroutine_recv: callback called (on the event loop) when the transaction succeed, with, as input, `recv_msg` and eventually other args
        given to .send
        :param coroutine_abrt: callback called (on the event loop) when the transaction fails, with, as input, `recv_msg` and eventually other args
        given to .send
        :param inter_msg: a list of `(message_class, coroutine_recv)`, that can be received during the resolution of the transaction but will not
        finalize it. `get_key` is used on these `message_class` to get the key of the transaction.
        """
        if get_key is None:
            get_key = lambda x: None
        if inter_msg is None:
            inter_msg = []

        # format is (other_msg, get_key, recv_handler, abrt_handler,responsible_for)
        # where responsible_for is the list of classes whose transaction will be killed when this message is received.
        self._msgs_registered[send_msg.__msgtype__] = ([recv_msg.__msgtype__] + [x.__msgtype__ for x, _ in inter_msg], get_key, None, None, [])
        self._msgs_registered[recv_msg.__msgtype__] = (
        [], get_key, coroutine_recv, coroutine_abrt, [recv_msg.__msgtype__] + [x.__msgtype__ for x, _ in inter_msg])

        self._transactions[recv_msg.__msgtype__] = {}
        for msg_class, handler in inter_msg:
            self._msgs_registered[msg_class.__msgtype__] = ([], get_key, handler, None, [])
            self._transactions[msg_class.__msgtype__] = {}

    async def _create_transaction(self, msg, *args, **kwargs):
        """
        Create a transaction with the distant server
        :param msg: message to be sent
        :param args: args to be sent to the coroutines given to `register_transaction`
        :param kwargs: kwargs to be sent to the coroutines given to `register_transaction`
        """
        recv_msgs, get_key, _1, _2, _3 = self._msgs_registered[msg.__msgtype__]
        key = get_key(msg)

        if key in self._transactions[recv_msgs[0]]:
            # If we already have a request for this particular key, just add it on the list of things to call
            for recv_msg in recv_msgs:
                self._transactions[recv_msg][key].append((args, kwargs))
        else:
            # If that's not the case, add us in the queue, and send the message
            for recv_msg in recv_msgs:
                self._transactions[recv_msg][key] = [(args, kwargs)]
            await ZMQUtils.send(self._socket, msg)

    async def _simple_send(self, msg):
        """
        Send a msg to the distant server
        """
        await ZMQUtils.send(self._socket, msg)

    async def _handle_pong(self, _):
        """
        Handle a pong
        """
        self._ping_count = 0

    async def _handle_unknown(self, _):
        """
        Handle a Unknown message; restart the client
        """
        await self._reconnect()

    async def _do_ping(self):
        """
        Task that ensures Pings are sent periodically to the distant server
        :return:
        """
        try:
            while True:
                await asyncio.sleep(1)
                if self._ping_count > 10:
                    await self._reconnect()
                else:
                    self._ping_count += 1
                    await ZMQUtils.send(self._socket, Ping())
        except asyncio.CancelledError:
            return
        except KeyboardInterrupt:
            return

    @abc.abstractmethod
    async def _on_disconnect(self):
        """
        Called when a connection has crashed. Should be overridden by subclass
        """
        pass

    @abc.abstractmethod
    async def _on_connect(self):
        """
        Called when a connection is created. Should be overridden by subclass.
        The registration with the remote server should be done here if necessary.
        """
        pass

    async def _reconnect(self):
        """
        Called when the remote server is innacessible and the connection has to be restarted
        """

        # 1. Close all transactions
        for msg_class in self._transactions:
            _1, _2, _3, coroutine_abrt, _4 = self._msgs_registered[msg_class]
            if coroutine_abrt is not None:
                for key in self._transactions[msg_class]:
                    for args, kwargs in self._transactions[msg_class][key]:
                        self._loop.create_task(coroutine_abrt(key, *args, **kwargs))
            self._transactions[msg_class] = {}

        # 2. Call on_disconnect
        await self._on_disconnect()

        # 3. Stop tasks
        for task in self._restartable_tasks:
            task.cancel()
        self._restartable_tasks = []

        # 4. Restart socket
        self._socket.disconnect(self._router_addr)

        # 5. Re-do start sequence
        await self.client_start()

    async def client_start(self):
        """
        Starts the client
        """
        await self._start_socket()
        await self._on_connect()

        self._ping_count = 0

        # Start the loops, and don't forget to add them to the list of asyncio task to close when the client restarts
        task_socket = self._loop.create_task(self._run_socket())
        task_ping = self._loop.create_task(self._do_ping())

        self._restartable_tasks.append(task_ping)
        self._restartable_tasks.append(task_socket)

    async def _start_socket(self):
        """
        Start the connection to the remote server
        """
        self._socket.connect(self._router_addr)

    async def _run_socket(self):
        """
        Task that runs this client.
        """
        try:
            while True:
                message = await ZMQUtils.recv(self._socket)
                msg_class = message.__msgtype__
                if msg_class in self._handlers_registered:
                    # If a handler is registered, give the message to it
                    self._loop.create_task(self._handlers_registered[msg_class](message))
                elif msg_class in self._transactions:
                    # If there are transaction associated, check if the key is ok
                    _1, get_key, coroutine_recv, _2, responsible = self._msgs_registered[msg_class]
                    key = get_key(message)
                    if key in self._transactions[msg_class]:
                        # key exists; call all the coroutines
                        for args, kwargs in self._transactions[msg_class][key]:
                            self._loop.create_task(coroutine_recv(message, *args, **kwargs))
                        # remove all transaction parts
                        for key2 in responsible:
                            del self._transactions[key2][key]
                    else:
                        # key does not exist
                        raise Exception("Received message %s for an unknown transaction %s", msg_class, key)
                else:
                    raise Exception("Received unknown message %s", msg_class)
        except asyncio.CancelledError:
            return
        except KeyboardInterrupt:
            return
