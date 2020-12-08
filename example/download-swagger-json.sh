#!/bin/bash
# Downloads the Swagger document
# USAGE EXAMPLE:
# ./download-swagger-json.sh --stage=staging --type=yaml --region=eu-west-1


# get variables from params
for i in "$@"
do
case $i in
  -s=*|--stage=*)
  STAGE="${i#*=}"
  shift
  ;;
  -r=*|--region=*)
  REGION="${i#*=}"
  shift 
  ;;
  -t=*|--type=*)
  TYPE="${i#*=}"
  shift
  ;;
esac
done

# exit if no input params are supplied
STAGE=${STAGE:?--stage or -s parameter. This is the stage of your API. }
REGION=${REGION:? --region or -r parameter is required. This is an AWS Region.}
TYPE=${TYPE:? --type or -t parameter. This is either yaml of json file type.}



cd `dirname $0`
set -e

APIID=""

json=$(aws apigateway get-rest-apis --region $REGION)

for row in $(echo "${json}" | jq -r '.items[] | @base64'); do
  _jq() {
    echo ${row} | base64 --decode | jq -r ${1}
  }

  if [ $(_jq '.name') = serverless-v2-documentation-example-$STAGE ]
  then
    APIID=$(_jq '.id') 
    echo $APIID
  fi
done

outputFileName=serverless-v2-documentation-example-$STAGE.$TYPE

printf "Downloading Swagger definition to ./$outputFileName
  API ID: $APIID
   Stage: $STAGE
  Accept: $TYPE\n\n"

aws apigateway get-export \
  --rest-api-id=$APIID \
  --stage-name=$STAGE \
  --export-type=swagger \
  --accept=application/$TYPE \
  --region=$REGION \
  $outputFileName

printf "
$(tput setaf 2)Done, your swagger document is: ./$outputFileName$(tput sgr0)
Go to http://editor.swagger.io/ and paste the contents of your swagger document to see it in Swagger UI"
