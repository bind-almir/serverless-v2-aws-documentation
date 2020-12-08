# serverless-aws-documentation-example

This project demonstrates how to document your Serverless API running on AWS.

You can use this by project by doing

    ./deploy.sh
    ./download-swagger-json.sh --stage=staging --type=yaml --region=eu-west-1
    # grab the downloaded file and copy-paste it into http://editor.swagger.io/

Once you're done, you can remove the API with:

    ./remove.sh
