#!/usr/bin/python
import subprocess, json, os, getpass, sys

def readConfig(file):
    with open(file) as json_file:
        data = json.load(json_file)
        return data

def getStepNumber(elem):
    return int(elem.split("_",1)[1].split(".",1)[0])

def hasKey(dic, key): 
    if key in dic.keys():
        return True
    else:
        return False

def buildCmdString(obj):
    if "login" in obj['action']:
        pwd = getpass.getpass("Enter {} password: ".format(obj['user']))
        res = 'login "{}" "{}" "{}"'.format(obj['server'],obj['user'], pwd)
    elif "log_out" in obj['action']:
        res = 'log_out'
    else:
        res = obj['action']
        if "name" in obj.keys():
            res+= ' "{}"'.format(obj["name"])
        if "file_name" in obj.keys():
            res+= ' "{}"'.format(obj["file_name"])
    
    return res.encode("utf-8")

def buildCmdList(l,data):
    for i in data:
        l.append(buildCmdString(i))
    return l


working_dir = "{}".format(sys.argv[1])
pwd=os.getcwd() + "/" + working_dir
inputFile=[file for file in os.listdir(pwd) if "step" in file]
inputFile.sort(key=getStepNumber)
cmds = []

for f in inputFile:
    data = readConfig('{}/{}'.format(pwd,f))
    buildCmdList(cmds, data['steps'])

p = subprocess.Popen('/bin/bash', stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

p.stdin.write("source ./bom-run_v2.sh" + "\n")

for cmd in cmds:
    p.stdin.write(cmd + "\n")
p.stdin.close()
print p.stdout.read()
print p.stderr.read()
