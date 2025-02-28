import { Field, ObjectType } from '@nestjs/graphql';
import { AbstractModel } from '@jobber/nestjs';

@ObjectType()
export class User extends AbstractModel {
  @Field()
  email: string;

  password?: string;

  salt?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}
