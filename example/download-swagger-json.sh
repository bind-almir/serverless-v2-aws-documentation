#!/bin/bash
# Downloads the JSON Swagger document
cd `dirname $0`
set -e
stage="staging"
region="eu-west-1" # must match serverless.yml:provider.region

apiId=""

json=$(aws apigateway get-rest-apis --region $region)

for row in $(echo "${json}" | jq -r '.items[] | @base64'); do
  _jq() {
    echo ${row} | base64 --decode | jq -r ${1}
  }

  if [ $(_jq '.name') = serverless-v2-documentation-example-$stage ]
  then
    apiId=$(_jq '.id') 
    echo $id
  fi
done


fileType=json

outputFileName=serverless-v2-documentation-example-$stage.$fileType
printf "Downloading Swagger definition to ./$outputFileName
  API ID: $apiId
   Stage: $stage
  Accept: $fileType\n\n"

aws apigateway get-export \
  --rest-api-id=$apiId \
  --stage-name=$stage \
  --export-type=swagger \
  --accept=application/$fileType \
  --region=$region \
  $outputFileName

printf "
$(tput setaf 2)Done, your swagger document is: ./$outputFileName$(tput sgr0)
Go to http://editor.swagger.io/ and paste the contents of your swagger document to see it in Swagger UI"
