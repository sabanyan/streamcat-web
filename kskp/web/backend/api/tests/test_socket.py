
from kskp.web.backend.api.tests.test_case_base import TestCaseBase
from kskp.web.backend.api import socket

class WebSocketMock():

    def send(self, message):
        print(message)
        return message

    def receive(self, message):
        print(message)
        return message

class WebSocketTestCase(TestCaseBase):

    def setUp(self):
        pass

    def tearDown(self):
        pass


