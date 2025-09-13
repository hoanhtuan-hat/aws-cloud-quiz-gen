// Keep data colocated as TypeScript for strict typing
import type { Category } from '../types/quiz';

export const quizData1: {
  categories: Category[];
  scoreInit: number;
  meta: Record<string, unknown>;
} = {
  categories: [
    {
      name: 'Compute',
      questions: [
        {
          id: 'aws-c-100',
          text: 'Which compute option gives the deepest discounts but can be interrupted?',
          options: ['On-Demand Instances', 'Reserved Instances', 'Spot Instances', 'Dedicated Hosts'],
          correctOption: 2,
          points: 100
        },
        {
          id: 'aws-c-200',
          text: 'Which load balancer operates at Layer 7 and supports path-based routing?',
          options: ['Network Load Balancer', 'Classic Load Balancer', 'Application Load Balancer', 'Gateway Load Balancer'],
          correctOption: 2,
          points: 200
        },
        {
          id: 'aws-c-300',
          text: 'Auto Scaling policies can scale on which CloudWatch metric by default for EC2?',
          options: ['CPUUtilization', 'NumberOfThreads', 'DiskQueueDepth', 'ReadIOPS'],
          correctOption: 0,
          points: 300
        },
        {
          id: 'aws-c-400',
          text: 'For serverless containers without managing servers, choose…',
          options: ['ECS on EC2', 'EKS managed node groups', 'ECS on Fargate', 'Elastic Beanstalk'],
          correctOption: 2,
          points: 400
        },
        {
          id: 'aws-c-500',
          text: 'Lambda reserved concurrency primarily guarantees…',
          options: ['Lower latency', 'A fixed number of parallel executions', 'More memory', 'Free invocations'],
          correctOption: 1,
          points: 500
        }
      ]
    },
    {
      name: 'Storage',
      questions: [
        {
          id: 'aws-s-100',
          text: 'Which service provides object storage with 11 9s durability?',
          options: ['EBS', 'EFS', 'S3 Standard', 'Instance Store'],
          correctOption: 2,
          points: 100
        },
        {
          id: 'aws-s-200',
          text: 'Which storage is a block device for EC2 instances?',
          options: ['EBS', 'S3', 'EFS', 'Glacier Deep Archive'],
          correctOption: 0,
          points: 200
        },
        {
          id: 'aws-s-300',
          text: 'Which option offers low-cost archival with hours-level retrieval?',
          options: ['S3 Standard-IA', 'S3 Glacier Flexible Retrieval', 'EFS Infrequent Access', 'S3 Intelligent-Tiering'],
          correctOption: 1,
          points: 300
        },
        {
          id: 'aws-s-400',
          text: 'To decouple producers/consumers with polling and at-least-once delivery, use…',
          options: ['SNS', 'SQS', 'EventBridge', 'Kinesis Data Streams'],
          correctOption: 1,
          points: 400
        },
        {
          id: 'aws-s-500',
          text: 'To share files across multiple EC2 instances in a VPC (POSIX), use…',
          options: ['EBS Multi-Attach', 'Amazon EFS', 'S3 with Transfer Acceleration', 'Instance Store'],
          correctOption: 1,
          points: 500
        }
      ]
    }
  ],
  scoreInit: 0,
  meta: { topic: 'AWS', count: 10, layout: 'two_columns' }
};

export default quizData;
