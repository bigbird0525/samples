#!/usr/bin/env bash

# export the profile of all ADF models per spaces
# save into $1 folder
# generate runtime lifecycle scripts
source /home/vitria/.bashrc
shopt -s expand_aliases

TARGET_DIR=$1
RUNTIME_ACTIONS=("start" "stop" "purge" "redeploy" "undeploy")

if [[ ".$TARGET_DIR" == "." ]]; then
   TARGET_DIR="profiles"
   CURR=$(dirname `readlink -f -- $0`)
   ROOT=$CURR/$PROFILE
else
   ROOT=$TARGET_DIR
fi

mkdir -p "$ROOT"

. parse_yaml.sh

eval $(parse_yaml profile_conf.yml "")

login() {
  via login -h https://$VIA_server:8443/vitria-oi -u $VIA_user -p $VIA_pass
}

export_all() {
  instanceList=`via server list runtime "*" -y sparkm | grep '/app/spark/'`
  #echo $instanceList | while read line
  OLD_IFS=$IFS
  IFS=$'\n'
  for line in ${instanceList}
  do
     REMOVE_HEAD=${line:4}
     BASE_URL=${REMOVE_HEAD%% :*}
     # find space name, spark/space
     INSTNACE_NAME=${BASE_URL##*=}
     if [[ ! ".${INSTNACE_NAME}" == ".${BASE_URL}" ]]; then
        BASE_URL=${BASE_URL%%\?*}
     else 
        INSTNACE_NAME=""
     fi
     FOLDER="" # space name or user name
     if [[ "${BASE_URL}" == */app/spark/space* ]] ; then # public
        PARTIAL=${BASE_URL:17}
        FOLDER=${PARTIAL%%/*}
        FOLDER="$( echo "$FOLDER" | sed 's/ /_/g' )"
     elif [[ "${BASE_URL}" == */app/spark/user* ]] ; then
        PARTIAL=${BASE_URL:16}
        FOLDER=${PARTIAL%%/*}
     fi
     # echo $FOLDER
     export_one "$FOLDER" "$BASE_URL" "$INSTNACE_NAME"
  done
  # merge all spaces command together
  merge
}

export_one() {
   FOLDER=$1
   BASE_URL=$2
   INSTNACE_NAME=$3
   echo 'Export profile for model "'$BASE_URL'", "'$INSTNACE_NAME'"'

   MODEL_NAME=${BASE_URL##*/}
   MODEL_NAME="$( echo "$MODEL_NAME" | sed 's/ /_/g' )"
   PARENT_PATH="$ROOT/$FOLDER"
   if [[ ! -d "$PARENT_PATH" ]]; then
      mkdir -p "$PARENT_PATH"
   fi
   if [[ ! ".$INSTNACE_NAME" == "." ]]; then
     via model profile "${BASE_URL}" --instance ${INSTNACE_NAME} > "$PARENT_PATH/${MODEL_NAME}_${INSTNACE_NAME}.json"
   else
     via model profile "${BASE_URL}" > "$PARENT_PATH/${MODEL_NAME}.json"
   fi
   for OP in ${RUNTIME_ACTIONS[@]}
   do
     record_script "$FOLDER" "$BASE_URL" "$INSTNACE_NAME" "$MODEL_NAME" ${OP}
   done
}

record_script() {
   FOLDER=$1
   BASE_URL=$2
   INSTNACE_NAME=$3
   MODEL_NAME=$4
   OPERATION=$5

   FILE="$ROOT/$FOLDER/$OPERATION.sh"
   if [[ ! ".$INSTNACE_NAME" == "." ]]; then
     if [[ "${OPERATION}" == "start" ]]; then
       echo '  via model '$OPERATION' "'${BASE_URL}'" --instance '${INSTNACE_NAME}' --profile "./'${FOLDER}'/'${MODEL_NAME}'_'${INSTNACE_NAME}'.json"' >> "${FILE}"
     else 
       echo '  via model '$OPERATION' "'${BASE_URL}'" --instance '${INSTNACE_NAME}'' >> "${FILE}"
     fi
   else
     if [[ "${OPERATION}" == "start" ]]; then
       echo '  via model '$OPERATION' "'${BASE_URL}'" --profile "./'${FOLDER}'/'${MODEL_NAME}'.json"' >> "${FILE}"
     else 
       echo '  via model '$OPERATION' "'${BASE_URL}'"' >> "${FILE}"
     fi
   fi
   if [[ -e "$FILE" ]]; then
      chmod +x "${FILE}"
   fi
}

merge() {
   FILES=`ls $ROOT`
   for OP in ${RUNTIME_ACTIONS[@]}
   do
     echo "" > "$ROOT/${OP}.sh"
     chmod +x "$ROOT/${OP}.sh"
   done
   for FILE in ${FILES}
   do 
     if [[ -d "$ROOT/${FILE}" ]]; then
       for OP in ${RUNTIME_ACTIONS[@]}
       do
         merge_script_declare "$FILE" $OP
       done
     fi
   done
   for OP in ${RUNTIME_ACTIONS[@]}
   do
     echo "" >> "$ROOT/${OP}.sh"
     echo "# main" >> "$ROOT/${OP}.sh"
     echo "COMMAND=\$1" >> "$ROOT/${OP}.sh"
     echo "if [[ ! \".\${COMMAND}\" == \".\" ]]; then" >> "$ROOT/${OP}.sh"
     echo "  COMMAND=\"\$( echo \"\$COMMAND\" | sed 's/ /_/g' )\" " >> "$ROOT/${OP}.sh"
     echo "fi" >> "$ROOT/${OP}.sh"
   done
   for FILE in ${FILES}
   do 
     if [[ -d "$ROOT/${FILE}" ]]; then
       for OP in ${RUNTIME_ACTIONS[@]}
       do
         merge_script_run "$FILE" $OP
       done
     fi
   done
}

merge_script_declare() {
   FOLDER=$1
   OPERATION=$2
   SOURCEFILE="${ROOT}/${FOLDER}/${OPERATION}.sh"
   TARGETFILE="${ROOT}/${OPERATION}.sh"
   METHOD="$( echo "$FOLDER" | sed 's/ /_/g' )" # replace empty space with underscore
   echo "" >> "${TARGETFILE}"
   echo "# method to ${OPERATION} space: ${FOLDER}" >> "${TARGETFILE}"
   echo "${OPERATION}_${METHOD}() {" >> "${TARGETFILE}"
   cat "${SOURCEFILE}" >> "${TARGETFILE}"
   echo "}" >> "${TARGETFILE}"
   rm -fr "${SOURCEFILE}"
}

merge_script_run() {
   FOLDER=$1
   OPERATION=$2
   TARGETFILE="${ROOT}/${OPERATION}.sh"
   METHOD="$( echo "$FOLDER" | sed 's/ /_/g' )"
   echo "if [[ \".\${COMMAND}\" == \".\" ]] || [[ \"\${COMMAND}\" == \"${FOLDER}\" ]] ; then" >> "${TARGETFILE}"
   echo '  '${OP}'_'${METHOD}'' >> "${TARGETFILE}"
   echo "fi" >> "${TARGETFILE}"
}

login
export_all

