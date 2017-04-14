# coding=utf-8
import mimetypes
import os
import shutil
import zipstream

from inginious.common.filesystems.provider import FileSystemProvider, NotFoundException


class LocalFSProvider(FileSystemProvider):
    """
    A FileSystemProvider that uses a real on-disk filesystem
    """
    @classmethod
    def get_needed_args(cls):
        """ Returns a list of arguments needed to create a FileSystemProvider. In the form 
            {
                "arg1": (int, False, "description1"),
                "arg2: (str, True, "description2")
            }

            The first part of the tuple is the type, the second indicates if the arg is mandatory
            Only int and str are supported as types.
        """
        return {
            "location": (str, True, "On-disk path to the directory containing courses/tasks")
        }

    @classmethod
    def init_from_args(cls, location):
        """ Given the args from get_needed_args, creates the FileSystemProvider """
        return LocalFSProvider(location)

    def __init__(self, prefix):
        super().__init__(prefix)

    def from_subfolder(self, subfolder):
        self._checkpath(subfolder)
        return LocalFSProvider(self.prefix + "/" + subfolder)

    def exists(self, path=None):
        if path is None:
            path = self.prefix
        else:
            path = os.path.join(self.prefix, path)
        return os.path.exists(path)

    def ensure_exists(self):
        if not os.path.exists(self.prefix):
            os.makedirs(self.prefix)

    def put(self, filepath, content):
        self._checkpath(filepath)
        fullpath = os.path.join(self.prefix, filepath)
        if "/" in fullpath:
            os.makedirs(os.path.join(*(os.path.split(fullpath)[:-1])), exist_ok=True)

        if isinstance(content, str):
            content = content.encode("utf-8")
        open(fullpath, 'wb').write(content)

    def get(self, filepath, timestamp=None):
        self._checkpath(filepath)
        return open(os.path.join(self.prefix, filepath), 'rb').read()

    def list(self, folders=True, files=True, recursive=False):
        if recursive:
            output = []
            for root, subdirs, files in os.walk(self.prefix):
                if folders:
                    output += [root+"/"+d for d in subdirs]
                if files:
                    output += [root+"/"+f for f in files]
            output = [os.path.relpath(f, self.prefix) for f in output]
        else:
            if files and folders:
                condition = lambda x: True
            elif files and not folders:
                condition = lambda x: os.path.isfile(os.path.join(self.prefix, x))
            elif folders and not files:
                condition = lambda x: os.path.isdir(os.path.join(self.prefix, x))
            else:
                return []
            output = [f for f in os.listdir(self.prefix) if condition(f)]
        isdir = lambda x: '/' if os.path.isdir(os.path.join(self.prefix, x)) else ''
        return [f+isdir(f) for f in output]

    def delete(self, filepath=None):
        if filepath is None:
            filepath = self.prefix
        else:
            self._checkpath(filepath)
            filepath = os.path.join(self.prefix, filepath)

        if os.path.isdir(filepath):
            shutil.rmtree(filepath)
        else:
            os.unlink(filepath)

    def get_last_modification_time(self, filepath):
        self._checkpath(filepath)
        try:
            return os.stat(os.path.join(self.prefix, filepath)).st_mtime
        except:
            raise NotFoundException()

    def move(self, src, dest):
        self._checkpath(src)
        self._checkpath(dest)
        if "/" in dest:
            os.makedirs(os.path.join(self.prefix, *(os.path.split(dest)[:-1])), exist_ok=True)
        shutil.move(os.path.join(self.prefix, src), os.path.join(self.prefix, dest))

    def copy_to(self, src_disk, dest=None):
        if dest is None:
            dest = self.prefix
        else:
            self._checkpath(dest)
            dest = os.path.join(self.prefix, dest)

        self._recursive_overwrite(src_disk, dest)

    def copy_from(self, src, dest_disk):
        if src is None:
            src = self.prefix
        else:
            self._checkpath(src)
            src = os.path.join(self.prefix, src)
        self._recursive_overwrite(src, dest_disk)

    def _recursive_overwrite(self, src, dest):
        """
        Copy src to dest, recursively and with file overwrite.
        """
        if os.path.isdir(src):
            if not os.path.isdir(dest):
                os.makedirs(dest)
            files = os.listdir(src)
            for f in files:
                self._recursive_overwrite(os.path.join(src, f),
                                          os.path.join(dest, f))
        else:
            shutil.copyfile(src, dest)

    def distribute(self, filepath, allow_folders=True):
        self._checkpath(filepath)
        path = os.path.abspath(os.path.join(self.prefix, filepath))
        if not os.path.exists(path):
            return ("invalid", None, None)
        if os.path.isdir(path):
            if not allow_folders:
                return ("invalid", None, None)
            zip = zipstream.ZipFile()
            for root, dirs, files in os.walk(path):
                for filename in files:
                    file_path = os.path.join(root, filename)
                    arcpath = os.path.relpath(file_path, path)
                    zip.write(file_path, arcpath)
            return ("local", "application/zip", zip.__iter__()) #the __iter__ is only present to fix a bug in web.py for py3; it only recognizes
                                                                #iterable that possess a __next__. ZipFile.__iter__ returns an iterable in the web.py
                                                                #sense
        elif os.path.isfile(path):
            mimetypes.init()
            mime_type = mimetypes.guess_type(path)
            return ("local", mime_type[0], open(path, 'rb'))
