import unittest
from unittest.mock import patch
import sample_mock
import SampleController as sample

class AcsControllerTestCase(unittest.TestCase): 
    print('Starting ACS Controller Tests - ')
    def setUp(self):
        self.sample = sample.SampleController(local_test=True)

    def test_check_params(self):
        print('\ntesting check params method')
        good_params = {'test':'value', 'otherTest': 'value2'}
        bad_params = {'test': 'fail'}
        req_keys = ['test', 'otherTest']
        self.assertTrue(self.sample.check_params(good_params, req_keys))
        self.assertFalse(self.sample.check_params(bad_params, req_keys))

    @patch('SampleController.requests.post')
    def test_sample_method_1(self, mock_post):
        print('\ntesting sample method 1')
        params = {
            'zone': 'sh',
            'macAddr': 'E8D11BDAB9C9'
        }
        mock_post.return_value.status_code = 200
        mock_post.return_value.body = sample_mock.sample_endpoint_1()
        response = self.sample.sample_method_1(params)
        self.assertEqual(response.status_code, 200)
        self.assertIn('response', response.body)

    def test_sample_method_1_fail(self):
        print('\nTest sample method with bad params')
        params = {
            'zone': 'sh'
        }
        response = self.sample.sample_method_1(params)
        self.assertIn('Missing required keys, parameters must include', response)

    @patch('SampleController.requests.post')
    def test_sample_method_1_external_failure(self, mock_post):
        print('\nTest sample method when external service returns other than 200 response')
        params = {
            'zone': 'sh',
            'macAddr': 'E8D11BDAB9'  # Bad MacAddr as an example
        }
        mock_post.return_value.status_code = 400
        mock_post.return_value.body = sample_mock.sample_endpoint_1(success=False)
        response = self.sample.sample_method_1(params)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.body)

    @patch('SampleController.requests.post')
    def test_sample_method_2(self, mock_post):
        print('\ntesting sample method 1')
        params = {
            'zone': 'sh',
            'macAddr': 'E8D11BDAB9C9',
            'parameter': 'test param'
        }
        mock_post.return_value.status_code = 200
        mock_post.return_value.body = sample_mock.sample_endpoint_2()
        response = self.sample.sample_method_2(params)
        self.assertEqual(response.status_code, 200)
        self.assertIn('response', response.body)

    def test_sample_method_2_fail(self):
        print('\nTest sample method with bad params')
        params = {
            'zone': 'sh'
        }
        response = self.sample.sample_method_2(params)
        self.assertIn('Missing required keys, parameters must include', response)

    @patch('SampleController.requests.post')
    def test_sample_method_2_external_failure(self, mock_post):
        print('\nTest sample method when external service returns other than 200 response')
        params = {
            'zone': 'sh',
            'macAddr': 'E8D11BDAB9',  # Bad MacAddr as an example
            'parameter': 'test param'
        }
        mock_post.return_value.status_code = 400
        mock_post.return_value.body = sample_mock.sample_endpoint_2(success=False)
        response = self.sample.sample_method_2(params)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.body)


if __name__ == '__main__': 
    unittest.main()