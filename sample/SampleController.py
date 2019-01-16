import requests
import os

class SampleController:

    def __init__(self, local_test=False):
        if local_test:
            self.url = 'http://localhost:3500'
        else: 
            self.url = os.environ['NODE_ENV']

    def check_params(self, parameters, req_keys):
        return next((False for key in req_keys if key not in parameters), True)

    def send_request(self,endpoint, parameters, req_keys):
        if self.check_params(parameters, req_keys):
            return requests.post(self.url+endpoint, data = parameters)
        else:
            return 'Missing required keys, parameters must include {}'.format(req_keys)

    def sample_method_1(self, parameters):
        req_keys = ['zone', 'macAddr']
        endpoint = '/v1/sample-endpoint-1'
        return self.send_request(endpoint, parameters, req_keys)

    def sample_method_2(self, parameters):
        req_keys = ['zone', 'macAddr', 'parameter']
        endpoint = '/v1/sample-endpoint-2'
        return self.send_request(endpoint, parameters, req_keys)
