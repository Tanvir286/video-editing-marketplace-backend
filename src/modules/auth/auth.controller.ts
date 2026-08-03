import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiTags,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import { LocalAuthGuard } from 'src/modules/auth/guards/local-auth.guard';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';

@ApiTags('🏳️Auth')
@ApiExtraModels(CreateUserDto, UpdateUserDto, VerifyEmailDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // get user details
  @ApiOperation({
    summary: 'Get user details ✧',
    description: 'Fetch the authenticated user profile information.',
  })
  @ApiBearerAuth(USER_TYPES.CLIENT)
  @ApiOkResponse({
    description: 'Authenticated user profile returned successfully.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    try {
      const user_id = req.user.userId;

      const response = await this.authService.me(user_id);

      return response;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch user details',
      };
    }
  }

  // register user
  @ApiOperation({
    summary: 'Register a user ✧',
    description: 'Create a new user account with email, password, and optional type.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({ description: 'User registered successfully.' })
  @ApiBadRequestResponse({ description: 'Validation or payload error.' })
  @Post('register')
  async create(@Body() data: CreateUserDto) {
    try {
      const name = data.name;
      const email = data.email;
      const password = data.password;
      const type = data.type;

      if (!name) {
        throw new HttpException('Name not provided', HttpStatus.UNAUTHORIZED);
      }

      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }

      if (!password) {
        throw new HttpException(
          'Password not provided',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const response = await this.authService.register({
        name: name,
        email: email,
        password: password,
        type: type,
      });

      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // update user
  @ApiOperation({
    summary: 'Update user profile ✧',
    description: 'Update the authenticated user profile and optionally upload an avatar.',
  })
  @ApiBearerAuth(USER_TYPES.CLIENT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Profile avatar image',
        },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        first_name: { type: 'string', example: 'John' },
        last_name: { type: 'string', example: 'Doe' },
        country: { type: 'string', example: 'Nigeria' },
        state: { type: 'string', example: 'Lagos' },
        city: { type: 'string', example: 'Lagos' },
        local_government: { type: 'string', example: 'Lagos' },
        zip_code: { type: 'string', example: '123456' },
        phone_number: { type: 'string', example: '+91 9876543210' },
        address: { type: 'string', example: 'New York, USA' },
        gender: { type: 'string', example: 'male' },
        date_of_birth: { type: 'string', example: '14/11/2001' },
      },
    },
  })
  @ApiOkResponse({ description: 'User updated successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiBadRequestResponse({ description: 'Validation or payload error.' })
  @UseGuards(JwtAuthGuard)
  @Patch('update')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateUser(
    @Req() req: Request,
    @Body() data: UpdateUserDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    try {
      const user_id = req.user.userId;
      const response = await this.authService.updateUser(user_id, data, image);
      return response;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update user',
      };
    }
  }

  @ApiOperation({
    summary: 'Refresh token',
    description: 'Refresh an access token using a refresh token.',
  })
  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Body() body: { refresh_token?: string }) {
    return this.authService.refreshToken(req.user?.userId, body.refresh_token);
  }

  @ApiOperation({
    summary: 'Logout',
    description: 'Invalidate the current refresh token for the authenticated user.',
  })
  @Post('logout')
  async logout(@Req() req: Request) {
    return this.authService.logout(req.user?.userId);
  }

  @ApiOperation({
    summary: 'Request email change',
    description: 'Start the email change flow for the authenticated user.',
  })
  @Post('request-email-change')
  async requestEmailChange(@Req() req: Request, @Body() body: { email?: string }) {
    return this.authService.requestEmailChange(req.user?.userId, body.email);
  }

  @ApiOperation({
    summary: 'Change email',
    description: 'Complete the email change flow for the authenticated user.',
  })
  @Post('change-email')
  async changeEmail(@Req() req: Request, @Body() body: { email?: string; token?: string }) {
    return this.authService.changeEmail(req.user?.userId, body.email, body.token);
  }

  @ApiOperation({
    summary: 'Generate 2FA secret',
    description: 'Generate a two-factor authentication secret for the authenticated user.',
  })
  @Post('2fa/generate')
  async generate2FASecret(@Req() req: Request) {
    return this.authService.generate2FASecret(req.user?.userId);
  }

  @ApiOperation({
    summary: 'Verify 2FA token',
    description: 'Verify a two-factor authentication token for the authenticated user.',
  })
  @Post('2fa/verify')
  async verify2FA(@Req() req: Request, @Body() body: { token?: string }) {
    return this.authService.verify2FA(req.user?.userId, body.token);
  }

  @ApiOperation({
    summary: 'Enable 2FA',
    description: 'Enable two-factor authentication for the authenticated user.',
  })
  @Post('2fa/enable')
  async enable2FA(@Req() req: Request) {
    return this.authService.enable2FA(req.user?.userId);
  }

  @ApiOperation({
    summary: 'Disable 2FA',
    description: 'Disable two-factor authentication for the authenticated user.',
  })
  @Post('2fa/disable')
  async disable2FA(@Req() req: Request) {
    return this.authService.disable2FA(req.user?.userId);
  }

  // login user
  @ApiOperation({
    summary: 'Login',
    description: `Authenticate a user. All users login through this endpoint.
    **User Types vs Assignable Roles:**
    - \`user_type\` determines system-level access (ADMIN,CLIENT,EDITOR, USER)
    
    **Test Credentials by User Type:**

    | User Type | Email | Password |
    |-----------|-------|----------|
    | Admin | admin@gmail.com  | password123 |
    | Client | client@gmail.com | password123 |
    | Editor | editor@gmail.com | password123 |`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', example: 'editor@gmail.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
    examples: {
      client: {
        summary: 'Client Login',
        description: 'User type: CLIENT',
        value: { email: 'client@waffles.com', password: 'password123' },
      },
      editor: {
        summary: 'Editor Login',
        description: 'User type: EDITOR',
        value: { email: 'editor@waffles.com', password: 'password123' },
      },
      admin: {
        summary: 'Admin Login',
        description: 'User type: ADMIN',
        value: { email: 'admin@waffles.com', password: 'password123' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Login successful. Access and refresh token returned.',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request, @Res() res: Response) {
    try {
      const user_id = req.user.id;
      const user_email = req.user.email;

      const response = await this.authService.login({
        userId: user_id,
        email: user_email,
      });

      // store to secure cookies
      res.cookie('refresh_token', response.authorization.refresh_token, {
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });

      res.json(response);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // forgot password
  @ApiOperation({
    summary: 'Forgot password',
    description: 'Sends a password reset email to the provided address.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', example: 'john@example.com' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Password reset token sent to email.',
    schema: {
      example: {
        success: true,
        message: 'Password reset email sent',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Email is missing or invalid.' })
  @Post('forgot-password')
  async forgotPassword(@Body() data: { email: string }) {
    try {
      const email = data.email;
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.forgotPassword(email);
    } catch (error) {
      return {
        success: false,
        message: 'Something went wrong',
      };
    }
  }

  // verify email
  @ApiOperation({
    summary: 'Verify email',
    description: 'Validates the email verification token sent to the user.',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiOkResponse({
    description: 'Email verification successful.',
    schema: {
      example: {
        success: true,
        message: 'Email verified successfully',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Email or token missing/invalid.' })
  @Post('verify-email')
  async verifyEmail(@Body() data: VerifyEmailDto) {
    try {
      const email = data.email;
      const token = data.token;
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      if (!token) {
        throw new HttpException('Token not provided', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.verifyEmail({
        email: email,
        token: token,
      });
    } catch (error) {
      return {
        success: false,
        message: 'Failed to verify email',
      };
    }
  }

  // resend verification email to verify the email
  @ApiOperation({
    summary: 'Resend verification email',
    description: 'Resends the email verification message to the given address.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', example: 'john@example.com' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Verification email resent successfully.',
    schema: {
      example: {
        success: true,
        message: 'Verification email resent',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Email is missing or invalid.' })
  @Post('resend-verification-email')
  async resendVerificationEmail(@Body() data: { email: string }) {
    try {
      const email = data.email;
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.resendVerificationEmail(email);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to resend verification email',
      };
    }
  }

  // reset password if user forget the password
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets the account password using a valid reset token.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'token', 'password'],
      properties: {
        email: { type: 'string', example: 'john@example.com' },
        token: { type: 'string', example: '123456' },
        password: { type: 'string', example: 'new-password-123' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Password reset successful.',
    schema: {
      example: {
        success: true,
        message: 'Password reset successful',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid email/token/password payload.',
  })
  @Post('reset-password')
  async resetPassword(
    @Body() data: { email: string; token: string; password: string },
  ) {
    try {
      const email = data.email;
      const token = data.token;
      const password = data.password;
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      if (!token) {
        throw new HttpException('Token not provided', HttpStatus.UNAUTHORIZED);
      }
      if (!password) {
        throw new HttpException(
          'Password not provided',
          HttpStatus.UNAUTHORIZED,
        );
      }
      return await this.authService.resetPassword({
        email: email,
        token: token,
        password: password,
      });
    } catch (error) {
      return {
        success: false,
        message: 'Something went wrong',
      };
    }
  }

  // resend token
  @ApiOperation({
    summary: 'Resend reset password token',
    description: 'Sends another password reset token to the email address.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', example: 'john@example.com' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Reset token resent successfully.',
    schema: {
      example: {
        success: true,
        message: 'Reset token resent',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Email is missing or invalid.' })
  @Post('resend-token')
  async resendToken(@Body() data: { email: string }) {
    try {
      const email = data.email;
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.resendToken(email);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to resend password reset token',
      };
    }
  }

  // veify token
  @ApiOperation({
    summary: 'Verify reset password token',
    description: 'Checks whether the provided password reset token is valid.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'token'],
      properties: {
        email: { type: 'string', example: 'john@example.com' },
        token: { type: 'string', example: '123456' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Reset token is valid.',
    schema: {
      example: {
        success: true,
        message: 'Token is valid',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Email or token missing/invalid.' })
  @Post('verify-token')
  async verifyToken(@Body() data: { email: string; token: string }) {
    try {
      const email = data.email;
      const token = data.token;
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      if (!token) {
        throw new HttpException('Token not provided', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.verifyToken({
        email: email,
        token: token,
      });
    } catch (error) {
      return {
        success: false,
        message: 'Failed to verify token',
      };
    }
  }

  // change password if user want to change the password
  @ApiOperation({
    summary: 'Change password',
    description: 'Changes the current authenticated user password.',
  })
  @ApiBearerAuth(USER_TYPES.CLIENT)
  @ApiBody({
    schema: {
      type: 'object',
      required: ['old_password', 'new_password'],
      properties: {
        old_password: { type: 'string', example: 'old-password-123' },
        new_password: { type: 'string', example: 'new-password-123' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Password changed successfully.',
    schema: {
      example: {
        success: true,
        message: 'Password changed successfully',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: Request,
    @Body() data: { email: string; old_password: string; new_password: string },
  ) {
    try {
      // const email = data.email;
      const user_id = req.user.userId;

      const oldPassword = data.old_password;
      const newPassword = data.new_password;
      // if (!email) {
      //   throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      // }
      if (!oldPassword) {
        throw new HttpException(
          'Old password not provided',
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (!newPassword) {
        throw new HttpException(
          'New password not provided',
          HttpStatus.UNAUTHORIZED,
        );
      }
      return await this.authService.changePassword({
        // email: email,
        user_id: user_id,
        oldPassword: oldPassword,
        newPassword: newPassword,
      });
    } catch (error) {
      return {
        success: false,
        message: 'Failed to change password',
      };
    }
  }

 

  

 



 

 
 

  

 
  // --------- end 2FA ---------
}
