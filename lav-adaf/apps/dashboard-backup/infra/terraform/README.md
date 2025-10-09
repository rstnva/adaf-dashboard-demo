# ADAF Terraform Infrastructure

This directory contains Terraform infrastructure-as-code for the ADAF Dashboard project, organized with a modular approach supporting multiple environments.

## Project Structure

```
infra/terraform/
├── modules/                 # Reusable Terraform modules
│   ├── network/            # VPC, subnets, security groups
│   ├── rds-postgres/       # PostgreSQL database with Multi-AZ
│   ├── redis/              # ElastiCache Redis cluster
│   ├── alb/                # Application Load Balancer with blue/green
│   ├── compute-ecs/        # ECS Fargate services (to be implemented)
│   ├── dns/                # Route53 and ACM certificates (to be implemented)
│   ├── waf/                # Web Application Firewall (to be implemented)
│   └── observability/      # CloudWatch, metrics, logging (to be implemented)
├── environments/           # Environment-specific configurations
│   ├── dev/                # Development environment
│   ├── staging/            # Staging environment  
│   └── prod/               # Production environment
└── README.md              # This file
```

## Quick Start - Development Environment

1. **Prerequisites**
   ```bash
   # Install Terraform >= 1.5.0
   terraform --version
   
   # Configure AWS CLI with appropriate credentials
   aws configure
   ```

2. **Backend Setup** (First time only)
   ```bash
   # Create S3 bucket for Terraform state
   aws s3 mb s3://adaf-terraform-state-dev --region us-west-2
   
   # Enable versioning
   aws s3api put-bucket-versioning \
     --bucket adaf-terraform-state-dev \
     --versioning-configuration Status=Enabled
   
   # Create DynamoDB table for state locking
   aws dynamodb create-table \
     --table-name adaf-terraform-locks-dev \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
     --region us-west-2
   ```

3. **Deploy Development Environment**
   ```bash
   cd environments/dev
   
   # Copy and customize variables
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your specific values
   
   # Initialize Terraform
   terraform init
   
   # Plan deployment
   terraform plan
   
   # Deploy infrastructure
   terraform apply
   ```

## Module Overview

### Network Module (`modules/network/`)
- **Purpose**: Core networking infrastructure foundation
- **Resources**: VPC, public/private/database subnets, NAT gateways, security groups, VPC Flow Logs
- **Features**: Multi-AZ setup, proper subnet segmentation, security group rules for all services
- **Outputs**: VPC ID, subnet IDs, security group IDs for other modules

### RDS PostgreSQL Module (`modules/rds-postgres/`)
- **Purpose**: Managed PostgreSQL database with high availability
- **Resources**: RDS instance, parameter groups, option groups, KMS encryption, Secrets Manager
- **Features**: Multi-AZ support, automated backups, enhanced monitoring, Performance Insights
- **Security**: Encryption at rest/transit, Secrets Manager integration, least privilege access

### Redis Module (`modules/redis/`)
- **Purpose**: ElastiCache Redis for caching and session storage
- **Resources**: ElastiCache replication group, parameter groups, CloudWatch logging
- **Features**: Cluster mode support, automatic failover, encryption, auth tokens
- **Monitoring**: CloudWatch alarms for CPU, memory, evictions, replication lag

### ALB Module (`modules/alb/`)
- **Purpose**: Application Load Balancer with blue/green deployment support
- **Resources**: ALB, target groups (blue/green), listeners, listener rules
- **Features**: SSL/TLS termination, health checks, weighted/header-based routing
- **Blue/Green**: Supports header-based routing and weighted canary deployments

## Environment Configuration

### Development (`environments/dev/`)
- **Purpose**: Development and testing environment
- **Configuration**: Single AZ, minimal resources, no encryption for cost optimization
- **Database**: db.t3.micro, 20GB storage, 1-day backups, no Multi-AZ
- **Redis**: cache.t3.micro, single node, no encryption
- **Features**: All modules enabled, CloudWatch alarms, blue/green ALB

### Staging (`environments/staging/`)
- **Purpose**: Pre-production testing environment (to be implemented)
- **Configuration**: Multi-AZ, production-like setup, moderate resources
- **Database**: Multi-AZ enabled, enhanced monitoring, encryption
- **Redis**: Replication enabled, encryption at rest/transit
- **Features**: SSL certificates, WAF protection, full observability

### Production (`environments/prod/`)
- **Purpose**: Production environment (to be implemented)
- **Configuration**: Full high availability, encryption, monitoring, performance optimization
- **Database**: Multi-AZ, Performance Insights, automated backups, read replicas
- **Redis**: Cluster mode, automatic failover, auth tokens, encryption
- **Features**: Route53 DNS, ACM certificates, WAF, comprehensive monitoring

## Security Configuration

### Encryption
- **RDS**: Encryption at rest with customer-managed KMS keys
- **Redis**: At-rest and in-transit encryption with auth tokens
- **Secrets**: AWS Secrets Manager for database credentials and Redis auth tokens
- **Traffic**: ALB SSL/TLS termination with modern cipher suites

### Network Security
- **VPC**: Private subnets for application and database tiers
- **Security Groups**: Least privilege access, specific port/protocol rules
- **NAT Gateway**: Secure outbound internet access for private subnets
- **Flow Logs**: VPC traffic monitoring and analysis

### Access Control
- **IAM**: Service-specific roles with minimal required permissions
- **Database**: Secrets Manager integration, no hardcoded credentials
- **Monitoring**: CloudWatch alarms for security and operational events

## Deployment Strategies

### Blue/Green Deployment
```bash
# Deploy to green environment
terraform apply -var="active_target_group=green"

# Test green environment with header routing
curl -H "X-Deployment-Target: green" https://your-alb-endpoint.com/health

# Switch traffic to green
# Update ALB listener default action (manual or via CI/CD)

# Cleanup blue environment when stable
```

### Canary Deployment
```bash
# Enable weighted routing (90% blue, 10% green)
terraform apply -var="enable_canary_routing=true" \
                -var="canary_blue_weight=90" \
                -var="canary_green_weight=10"

# Monitor metrics and gradually shift traffic
# Increase green weight as confidence grows
```

## Monitoring and Observability

### CloudWatch Alarms
- **RDS**: CPU utilization, connection count, free storage space
- **Redis**: CPU utilization, memory usage, evictions, replication lag  
- **ALB**: Response time, healthy host count, 5XX errors
- **Custom**: Application-specific metrics via CloudWatch Agent

### Logging
- **VPC Flow Logs**: Network traffic analysis and security monitoring
- **RDS**: PostgreSQL logs, slow query logs, error logs
- **Redis**: Slow log analysis via CloudWatch
- **ALB**: Access logs for request analysis and debugging

### Secrets Management
- **Database Credentials**: Stored in AWS Secrets Manager with automatic rotation
- **Redis Auth Tokens**: Encrypted storage with least-privilege access
- **SSL Certificates**: AWS Certificate Manager for automatic renewal

## Cost Optimization

### Development Environment
- **RDS**: db.t3.micro instance, single AZ, minimal backup retention
- **Redis**: cache.t3.micro, single node cluster, no encryption overhead
- **Network**: Single NAT gateway, basic security group rules
- **Monitoring**: Essential alarms only, short log retention

### Resource Scaling
```bash
# Scale RDS instance class
terraform apply -var="rds_instance_class=db.t3.small"

# Scale Redis node type  
terraform apply -var="redis_node_type=cache.t3.small"

# Enable Multi-AZ for higher availability
terraform apply -var="rds_multi_az=true"
```

## Troubleshooting

### Common Issues
1. **Backend Configuration**: Ensure S3 bucket and DynamoDB table exist before `terraform init`
2. **AWS Permissions**: Verify IAM permissions for all AWS services used
3. **Resource Limits**: Check AWS account limits for VPCs, subnets, security groups
4. **State Conflicts**: Use DynamoDB state locking to prevent concurrent modifications

### Debugging Commands
```bash
# Check Terraform state
terraform show

# Validate configuration
terraform validate

# Format code
terraform fmt -recursive

# Import existing resources
terraform import aws_vpc.main vpc-12345678

# Refresh state from AWS
terraform refresh
```

## Next Steps - Implementation Roadmap

### Phase 1: Core Infrastructure ✅
- [x] Network module (VPC, subnets, security groups)
- [x] RDS PostgreSQL module with Multi-AZ support
- [x] Redis ElastiCache module with clustering
- [x] ALB module with blue/green deployment support
- [x] Development environment configuration

### Phase 2: Compute and Application (Next)
- [ ] ECS Fargate compute module
- [ ] Container definitions and task definitions
- [ ] Auto-scaling policies and target tracking
- [ ] Service discovery and load balancer integration

### Phase 3: DNS and Security  
- [ ] Route53 DNS module with health checks
- [ ] ACM SSL certificate management
- [ ] WAF module with custom rules and rate limiting
- [ ] Security headers and DDoS protection

### Phase 4: Observability and Monitoring
- [ ] CloudWatch dashboard and custom metrics
- [ ] X-Ray distributed tracing integration
- [ ] Prometheus/Grafana for application metrics  
- [ ] Centralized logging with ELK stack

### Phase 5: CI/CD Integration
- [ ] GitHub Actions workflows for terraform plan/apply
- [ ] Environment promotion pipeline (dev → staging → prod)
- [ ] Automated testing and validation
- [ ] Blue/green deployment automation

## Support and Maintenance

### Terraform State Management
- **Backend**: S3 with versioning and encryption
- **Locking**: DynamoDB prevents concurrent modifications
- **Backup**: Regular state file backups for disaster recovery

### Version Management
- **Terraform**: Pin to specific version for consistency
- **Providers**: Use version constraints for stability
- **Modules**: Semantic versioning for module releases

### Documentation
- **Code**: Inline comments for complex logic
- **Variables**: Comprehensive descriptions and validation
- **Outputs**: Clear descriptions for integration points