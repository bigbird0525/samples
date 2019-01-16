import setuptools

setuptools.setup(
	name='SampleLib',
	version='0.5.dev',
	packages=setuptools.find_packages(exclude=['*_test.py','*_mock.py', '*__pycache__*']),
	install_requires=['requests', 'socketIO-client-nexus'],
	author='Andrew Ravn',
	author_email='{removed for sample}',
	url='{removed for sample}',
	project_url={
		"Source Code": "{removed for sample}"
	}
	)