output "function_url" {
  description = "Lambda Function URL"
  value       = aws_lambda_function_url.app.function_url
}

output "function_arn" {
  description = "Lambda Function ARN"
  value       = aws_lambda_function.app.arn
}