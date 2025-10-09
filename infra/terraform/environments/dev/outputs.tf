# Development Environment Outputs

# Network Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.network.vpc_id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = module.network.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.network.private_subnet_ids
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = module.network.database_subnet_ids
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = module.network.security_group_alb_id
}

output "ecs_security_group_id" {
  description = "ECS security group ID"
  value       = module.network.security_group_ecs_id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = module.network.security_group_rds_id
}

output "redis_security_group_id" {
  description = "Redis security group ID"
  value       = module.network.security_group_redis_id
}

# Database Outputs
output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS port"
  value       = module.rds.db_instance_port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.db_instance_name
}

output "rds_username" {
  description = "RDS username"
  value       = module.rds.db_instance_username
  sensitive   = true
}

output "rds_secrets_manager_secret_arn" {
  description = "RDS Secrets Manager secret ARN"
  value       = module.rds.secrets_manager_secret_arn
}

# Redis Outputs
output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.redis.primary_endpoint_address
}

output "redis_port" {
  description = "Redis port"
  value       = module.redis.port
}

output "redis_secrets_manager_secret_arn" {
  description = "Redis Secrets Manager secret ARN"
  value       = module.redis.secrets_manager_secret_arn
}

# ALB Outputs
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID"
  value       = module.alb.alb_zone_id
}

output "alb_endpoint" {
  description = "ALB endpoint URL"
  value       = module.alb.alb_endpoint
}

output "blue_target_group_arn" {
  description = "Blue target group ARN"
  value       = module.alb.blue_target_group_arn
}

output "green_target_group_arn" {
  description = "Green target group ARN"
  value       = module.alb.green_target_group_arn
}

output "active_target_group_arn" {
  description = "Active target group ARN"
  value       = module.alb.active_target_group_arn
}

# Environment Information
output "environment_info" {
  description = "Environment information summary"
  value = {
    environment     = "dev"
    project_name    = "adaf-dev"
    aws_region      = var.aws_region
    vpc_cidr        = var.vpc_cidr
    app_port        = var.app_port
    health_check    = var.health_check_path
    database_name   = var.database_name
    postgres_version = var.postgres_version
    redis_version   = var.redis_version
  }
}

# Blue/Green Deployment Information
output "blue_green_deployment" {
  description = "Blue/Green deployment configuration"
  value       = module.alb.blue_green_info
}