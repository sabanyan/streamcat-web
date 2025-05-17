
from streamcat.web.backend.api.tests.test_case_base import TestCaseBase
from streamcat.web.backend.api import socket

class WebSocketMock():

    def send(self, message):
        print(message)
        return message

    def receive(self, message):
        print(message)
        return message

class WebSocketTest(TestCaseBase):

    def setUp(self):
        pass

    def tearDown(self):
        pass


