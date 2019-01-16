#!/bin/bash
exitcode=0
array=()
while IFS=  read -r -d $'\0'; do
    array+=("$REPLY")
done < <(find . -name "*_test.py" -print0);
for i in "${array[@]}"; do
	python3 $i
	if [ $? -ne 0 ]; then
		exitcode=1
	fi;
done
exit $exitcode