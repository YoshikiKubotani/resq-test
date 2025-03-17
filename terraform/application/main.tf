terraform {
  required_version = "1.10.4"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.90.0"
    }
  }
}

provider "aws" {}

# Lambda Function
module "lambda" {
  source = "../modules/lambda"

  environment        = var.environment
  project_name       = var.project_name
  image_tag          = var.image_tag
  ecr_repository_url = var.ecr_repository_url
  ecr_repository_arn = var.ecr_repository_arn
  lambda_memory_size = var.lambda_memory_size
  lambda_timeout     = var.lambda_timeout
  allowed_origins    = var.allowed_origins
}

# module "lambda" {
#   source = "terraform-aws-modules/lambda/aws"
#   version = "7.20.1"

#   function_name = "${var.project_name}-${var.environment}"

#   create_package = false

#   image_uri    = "${var.ecr_repository_url}:${var.image_tag}"
#   package_type = "Image"

#   memory_size = var.lambda_memory_size
#   timeout     = var.lambda_timeout

#   tags = {
#     Environment = var.environment
#     Project     = var.project_name
#     ManagedBy   = "terraform"
#   }
# }

# Output definitions
output "function_url" {
  description = "Lambda Function URL"
  value       = module.lambda.function_url
}