#!/bin/bash
source ./init.sh
shopt -s expand_aliases

# Feed name of function
getActionState() {
  if [ $2 -eq 0 ]; then
      echo "$1 successful";
  else 
    echo "$1 failed";
  fi
}

# Feed arguments in this order: Server URL, User, Password
login() {
  via login -h https://${1}:8443/vitria-oi -u ${2} -p ${3}
  getActionState $0 $?
  echo "Vitria token: $VTTOKEN";
}

log_out() {
  via logout
  echo "Logged out of current session";
}

# Feed arguments in this order: Space, File name
export_space() {
  echo "Exporting $1"
  via model export -s "${1}" "${2}"
  getActionState $0 $?
}

# Feed arguments in this order: Model, File name
export_model() {
  echo "Exporting $1"
  via model export -m "$1" "$2"
  getActionState $0 $?
}

# Feed arguments in this order: Space, File name
import_space() {
  echo "Exporting $1"
  via model import -s "${1}" "${2}";
  getActionState $0 $?
}

# Feed arguments in this order: Token, File name
import_model() {
  echo "Exporting $1"
  via model import -t $1 $2
  getActionState $0 $?
}

# Feed in space name
delete_space() {
  echo "Deleting $1"
  via space delete --empty "${1}"
  getActionState $0 $?
}

#Feed in model name
delete_model() {
  echo "Deleting $1"
  via model delete --empty "${1}"
  getActionState $0 $?
}

# Feed arguments in this order: Model, Profile
start_model() {
  echo "Starting $1"
  via model start "${1}" --profile "${2}"
  getActionState $0 $?
}

# Feed function model name
stop_model() {
  echo "Stopping $1"
  via model stop "${1}"
  getActionState $0 $?
}