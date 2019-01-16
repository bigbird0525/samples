#!/bin/sh
# This script installs the python modules contained in the repo
exitcode=0
# First, the old versions of the modules installed are erased
modArr=()

while IFS=  read -r -d $'\0'; do
	modArr+=("$REPLY")
done < <(find -maxdepth 1 -name "*" -type d -print0)

packArr=()
user=$( echo "$PWD" |cut -d/ -f3)
echo "Working directory - $PWD"
if [[ user = {removed for sample} ]]; then
	while IFS=  read -r -d $'\0'; do
		packArr+=("$REPLY")
	done < <(find /usr/lib/python3.6/site-packages/ -maxdepth 1 -name "*" -type d -print0)
else
	while IFS= read -r -d $'\0'; do
		packArr+=("$REPLY")
	done < <(find ~/.local/lib/python3.6/site-packages/ -maxdepth 1 -name "*" -type d -print0)
fi;

echo "Removing old modules..."
for m in "${modArr[@]}"; do
	substring=$( echo "$m" |cut -d/ -f2 )
	if [[ $substring != *.* ]]; then
		for p in "${packArr[@]}"; do
			if [[ $p = *$substring* ]]  || [[ $p = *"cpeLib"* ]]; then
				packArr=("${packArr[@]/$p}")
				echo "$p"
				rm -r $p
			fi;
		done
	fi;	
done

# Second, the script begins installing the new modules
echo "Checking setup tools version..."
sudo python3 -m pip install --upgrade setuptools wheel
if [ $? -ne 0 ]; then
	# python3 -m pip install --user --upgrade setuptools wheel
	exitcode=1
	exit $exitcode
fi;
echo "Running setup tools..."
sudo python3 ./setup.py sdist bdist_wheel;
if [ $? -ne 0 ]; then
	exitcode=1
	exit $exitcode
fi;

echo "Installing python library"
pip3 install --trusted-host pypi.org --trusted-host files.pythonhosted.org --target=/usr/lib/python3.6/site-packages dist/*.whl;
if [ $? -ne 0 ]; then
	echo "Installing locally"
    pip3 install --trusted-host pypi.org --trusted-host files.pythonhosted.org --user dist/*.whl;
	if [ $? -ne 0 ]; then
	    exitcode=1
		exit $exitcode
	fi;
fi;

# Third, cleans up excess directories created during setup process
echo "Cleaning up job"
sudo rm -r ./build ./sample.egg-info ./dist;

exit $exitcode