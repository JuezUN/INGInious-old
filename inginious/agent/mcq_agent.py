# -*- coding: utf-8 -*-
#
# This file is part of INGInious. See the LICENSE and the COPYRIGHTS files for
# more information about the licensing of this file.
import logging
from inginious.agent.agent import Agent, CannotCreateJobException
from inginious.common.course_factory import create_factories
from inginious.common.messages import BackendNewJob, BackendKillJob, BackendNewBatchJob


class MCQAgent(Agent):
    def __init__(self, context, backend_addr, concurrency, task_directory):
        """
        :param context: ZeroMQ context for this process
        :param backend_addr: address of the backend (for example, "tcp://127.0.0.1:2222")
        :param course_factory: course factory
        :param task_factory: task factory
        """
        super().__init__(context, backend_addr, concurrency, task_directory)
        self._logger = logging.getLogger("inginious.agent.mcq")

        # Create a course factory
        course_factory, _ = create_factories(task_directory)
        self.course_factory = course_factory

    @property
    def environments(self):
        return {"mcq": {"id": "mcq", "created": 0}}

    @property
    def batch_environments(self):
        return {}

    async def new_batch_job(self, message: BackendNewBatchJob):
        self._logger.error("BackendNewBatchJob received, which does not make sense for a MCQ agent")
        await self.send_batch_job_result(message.job_id, -1, 'This agent cannot run batch jobs', "", None)

    async def new_job(self, msg: BackendNewJob):
        try:
            task = self.course_factory.get_task(msg.course_id, msg.task_id)
        except:
            self._logger.error("Task %s/%s not available on this agent", msg.course_id, msg.task_id)
            raise CannotCreateJobException("Task is not available on this agent")

        result, need_emul, text, problems, error_count = task.check_answer(msg.inputdata)
        if need_emul:
            self._logger.warning("Task %s/%s is not a pure MCQ but has env=MCQ", msg.course_id, msg.task_id)
            raise CannotCreateJobException("Task wrongly configured as a MCQ")

        if error_count != 0:
            text.append("You have %i errors in the multiple choice questions" % error_count)

        nb_subproblems = len(task.get_problems())
        grade = 100.0 * float(nb_subproblems - error_count) / float(nb_subproblems)

        await self.send_job_result(msg.job_id, ("success" if result else "failed"), "\n".join(text), grade, problems, {}, {}, None)

    async def kill_job(self, message: BackendKillJob):
        pass
