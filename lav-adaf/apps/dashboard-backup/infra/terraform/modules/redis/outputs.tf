# Redis ElastiCache Module Outputs

output "replication_group_id" {
  description = "ID of the ElastiCache replication group"
  value       = aws_elasticache_replication_group.redis.id
}

output "replication_group_arn" {
  description = "ARN of the ElastiCache replication group"
  value       = aws_elasticache_replication_group.redis.arn
}

output "primary_endpoint_address" {
  description = "Address of the endpoint for the primary node"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "configuration_endpoint_address" {
  description = "Address of the replication group configuration endpoint (cluster mode)"
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
}

output "reader_endpoint_address" {
  description = "Address of the endpoint for the reader node"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
}

output "member_clusters" {
  description = "Identifiers of all the nodes that are part of this replication group"
  value       = aws_elasticache_replication_group.redis.member_clusters
}

output "port" {
  description = "Port number on which each of the cache nodes will accept connections"
  value       = aws_elasticache_replication_group.redis.port
}

output "engine_version_actual" {
  description = "Running version of the cache engine"
  value       = aws_elasticache_replication_group.redis.engine_version_actual
}

output "cluster_enabled" {
  description = "Indicates if cluster mode is enabled"
  value       = aws_elasticache_replication_group.redis.cluster_enabled
}

output "parameter_group_name" {
  description = "Name of the parameter group"
  value       = aws_elasticache_parameter_group.redis.name
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret containing Redis auth token"
  value       = var.auth_token_enabled ? aws_secretsmanager_secret.redis_auth_token[0].arn : null
}

output "secrets_manager_secret_name" {
  description = "Name of the Secrets Manager secret containing Redis auth token"
  value       = var.auth_token_enabled ? aws_secretsmanager_secret.redis_auth_token[0].name : null
}

output "kms_key_id" {
  description = "KMS key ID used for encryption"
  value       = var.at_rest_encryption_enabled ? aws_kms_key.redis[0].key_id : null
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = var.at_rest_encryption_enabled ? aws_kms_key.redis[0].arn : null
}

output "log_group_name" {
  description = "CloudWatch log group name for Redis slow logs"
  value       = aws_cloudwatch_log_group.redis_slow.name
}

# Connection information for applications
output "redis_url" {
  description = "Redis connection URL"
  value = var.auth_token_enabled ? (
    var.transit_encryption_enabled ? 
    "rediss://:${urlencode(random_password.redis_auth_token[0].result)}@${coalesce(aws_elasticache_replication_group.redis.configuration_endpoint_address, aws_elasticache_replication_group.redis.primary_endpoint_address)}:${aws_elasticache_replication_group.redis.port}" :
    "redis://:${urlencode(random_password.redis_auth_token[0].result)}@${coalesce(aws_elasticache_replication_group.redis.configuration_endpoint_address, aws_elasticache_replication_group.redis.primary_endpoint_address)}:${aws_elasticache_replication_group.redis.port}"
  ) : (
    var.transit_encryption_enabled ? 
    "rediss://${coalesce(aws_elasticache_replication_group.redis.configuration_endpoint_address, aws_elasticache_replication_group.redis.primary_endpoint_address)}:${aws_elasticache_replication_group.redis.port}" :
    "redis://${coalesce(aws_elasticache_replication_group.redis.configuration_endpoint_address, aws_elasticache_replication_group.redis.primary_endpoint_address)}:${aws_elasticache_replication_group.redis.port}"
  )
  sensitive = true
}

output "endpoint_info" {
  description = "Redis endpoint information for application configuration"
  value = {
    host                = coalesce(aws_elasticache_replication_group.redis.configuration_endpoint_address, aws_elasticache_replication_group.redis.primary_endpoint_address)
    port                = aws_elasticache_replication_group.redis.port
    auth_token_enabled  = var.auth_token_enabled
    ssl_enabled         = var.transit_encryption_enabled
    cluster_mode        = aws_elasticache_replication_group.redis.cluster_enabled
  }
  sensitive = true
}