def sample_endpoint_1(success=True):
	if success:
		return {"response":
					{"deviceId":"12334",
					"vendor":"Vendor Name",
					"model":"Model Number",
					"macAddr":"DEADBEEFCAFE",
					"ip":"192.168.1.2",
					"zone":"zone information"}
				}
	else:
		return  {"error": {"error messages will be passed here"}}

def sample_endpoint_2(success=True):
	if success:
		return {"response": 'success'}
	else:
		return {"error": {"error messages will be passed here"}}
