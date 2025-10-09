# ADAF Dashboard - Development Environment
# Terraform configuration for dev environment with basic resources

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Backend configuration - update with your S3 bucket and DynamoDB table
  backend "s3" {
    bucket         = "adaf-terraform-state-dev"
    key            = "environments/dev/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "adaf-terraform-locks-dev"
  }
}

# AWS Provider Configuration
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "dev"
      Project     = "ADAF"
      ManagedBy   = "Terraform"
      Owner       = "DevOps"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local values
locals {
  project_name = "adaf-dev"
  environment  = "dev"
  
  common_tags = {
    Environment = local.environment
    Project     = "ADAF"
    ManagedBy   = "Terraform"
    Owner       = "DevOps"
  }
}

# Network Infrastructure
module "network" {
  source = "../../modules/network"

  project_name        = local.project_name
  vpc_cidr           = var.vpc_cidr
  enable_nat_gateway = var.enable_nat_gateway
  enable_flow_logs   = var.enable_flow_logs
  
  common_tags = local.common_tags
}

# RDS PostgreSQL Database
module "rds" {
  source = "../../modules/rds-postgres"

  project_name    = local.project_name
  environment     = local.environment
  
  # Database configuration
  postgres_version         = var.postgres_version
  instance_class          = var.rds_instance_class
  allocated_storage       = var.rds_allocated_storage
  max_allocated_storage   = var.rds_max_allocated_storage
  database_name           = var.database_name
  database_username       = var.database_username
  
  # High availability
  multi_az                = var.rds_multi_az
  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window
  
  # Monitoring
  enhanced_monitoring_interval = var.enhanced_monitoring_interval
  performance_insights_enabled = var.performance_insights_enabled
  
  # Security
  deletion_protection    = var.rds_deletion_protection
  skip_final_snapshot   = var.skip_final_snapshot
  
  # Network
  db_subnet_group_name = module.network.db_subnet_group_name
  security_group_ids   = [module.network.security_group_rds_id]
  
  # Monitoring
  create_cloudwatch_alarms = var.create_cloudwatch_alarms
  
  common_tags = local.common_tags

  depends_on = [module.network]
}

# Redis ElastiCache
module "redis" {
  source = "../../modules/redis"

  project_name = local.project_name
  environment  = local.environment
  
  # Redis configuration
  redis_version           = var.redis_version
  node_type              = var.redis_node_type
  num_cache_clusters     = var.redis_num_cache_clusters
  
  # Security
  at_rest_encryption_enabled = var.redis_encryption_at_rest
  transit_encryption_enabled = var.redis_encryption_in_transit
  auth_token_enabled        = var.redis_auth_token_enabled
  
  # Backup
  snapshot_retention_limit = var.redis_snapshot_retention
  snapshot_window         = var.redis_snapshot_window
  maintenance_window      = var.redis_maintenance_window
  
  # Network
  subnet_group_name  = module.network.cache_subnet_group_name
  security_group_ids = [module.network.security_group_redis_id]
  
  # Monitoring
  create_cloudwatch_alarms = var.create_cloudwatch_alarms
  
  common_tags = local.common_tags

  depends_on = [module.network]
}

# Application Load Balancer
module "alb" {
  source = "../../modules/alb"

  project_name = local.project_name
  environment  = local.environment
  
  # Network configuration
  vpc_id             = module.network.vpc_id
  subnet_ids         = module.network.public_subnet_ids
  security_group_ids = [module.network.security_group_alb_id]
  
  # Target group configuration
  target_port     = var.app_port
  target_protocol = "HTTP"
  target_type     = "ip"
  
  # Health check
  health_check_path     = var.health_check_path
  health_check_protocol = "HTTP"
  health_check_matcher  = "200"
  
  # SSL/TLS - disabled for dev
  certificate_arn       = null
  enable_https_redirect = false
  
  # Blue/Green deployment
  active_target_group    = "blue"
  enable_header_routing  = true
  enable_canary_routing  = false
  
  # Monitoring
  create_cloudwatch_alarms = var.create_cloudwatch_alarms
  
  common_tags = local.common_tags

  depends_on = [module.network]
}