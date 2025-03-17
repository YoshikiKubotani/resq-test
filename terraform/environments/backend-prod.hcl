bucket         = "resq-backend-terraform-state"
key            = "environments/prod/terraform.tfstate"
region         = "ap-northeast-1"
dynamodb_table = "resq-backend-terraform-state-lock"
encrypt        = true