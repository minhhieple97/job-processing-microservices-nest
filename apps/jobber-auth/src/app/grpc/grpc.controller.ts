import { Controller } from '@nestjs/common';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  AuthenticateRequest,
  User,
} from 'proto-types/proto/auth';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

@Controller()
@AuthServiceControllerMethods()
export class GrpcController implements AuthServiceController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  async authenticate(request: AuthenticateRequest): Promise<User> {
    try {
      const payload = this.jwtService.verify(request.token);
      const user = await this.userService.findOne(payload.sub);

      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        email: user.email,
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
