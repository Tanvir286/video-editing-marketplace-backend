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

@ApiTags('auth')
@ApiExtraModels(CreateUserDto, UpdateUserDto, VerifyEmailDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // get user details
  @ApiOperation({ summary: 'Get user details' })
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
  @ApiOperation({ summary: 'Register a user' })
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

  // get all clients
  @ApiOperation({ summary: 'Get all clients' })
  @ApiBearerAuth(USER_TYPES.ADMIN)
  @ApiOkResponse({ description: 'Client list fetched successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @UseGuards(JwtAuthGuard)
  @Get('clients')
  async getAllClients() {
    try {
      const clients = await this.authService.getAllClients();
      return clients;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch clients',
      };
    }
  }

  // get all editors
  @ApiOperation({ summary: 'Get all editors' })
  @ApiBearerAuth(USER_TYPES.ADMIN)
  @ApiOkResponse({ description: 'Editor list fetched successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  // @UseGuards(JwtAuthGuard)
  @Get('editors')
  async getAllEditors() {
    try {
      const editors = await this.authService.getAllEditors();
      return editors;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch editors',
      };
    }
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
  async login(
    @Req() req: Request,
    @Res() res: Response
  ) {
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
  @ApiOperation({ summary: 'Forgot password' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', example: 'john@example.com' },
      },
    },
  })
  @ApiOkResponse({ description: 'Password reset token sent to email.' })
  @ApiBadRequestResponse({ description: 'Email is missing or invalid.' })
  @Post('forgot-password')
  async forgotPassword(
    @Body() data: { email: string }
  ) {
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
  @ApiOperation({ summary: 'Verify email' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiOkResponse({ description: 'Email verification successful.' })
  @ApiBadRequestResponse({ description: 'Email or token missing/invalid.' })
  @Post('verify-email')
  async verifyEmail(
    @Body() data: VerifyEmailDto
  ) {
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
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', example: 'john@example.com' },
      },
    },
  })
  @ApiOkResponse({ description: 'Verification email resent successfully.' })
  @ApiBadRequestResponse({ description: 'Email is missing or invalid.' })
  @Post('resend-verification-email')
  async resendVerificationEmail(
    @Body() data: { email: string }
  ) {
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
  @ApiOperation({ summary: 'Reset password' })
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
  @ApiOkResponse({ description: 'Password reset successful.' })
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
  @ApiOperation({ summary: 'Resend reset password token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', example: 'john@example.com' },
      },
    },
  })
  @ApiOkResponse({ description: 'Reset token resent successfully.' })
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
  @ApiOperation({ summary: 'Verify reset password token' })
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
  @ApiOkResponse({ description: 'Reset token is valid.' })
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
  @ApiOperation({ summary: 'Change password' })
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
  @ApiOkResponse({ description: 'Password changed successfully.' })
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
  //-----------------------------------------------(end)----------------------------------------------------------------------

  @ApiOperation({ summary: 'Refresh token' })
  @ApiBearerAuth(USER_TYPES.CLIENT)
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refresh_token'],
      properties: {
        refresh_token: { type: 'string', example: 'refresh-token-value' },
      },
    },
  })
  @ApiOkResponse({ description: 'Access token refreshed successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @UseGuards(JwtAuthGuard)
  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Body() body: { refresh_token: string },
  ) {
    try {
      const user_id = req.user.userId;

      const response = await this.authService.refreshToken(
        user_id,
        body.refresh_token,
      );

      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Logout user' })
  @ApiBearerAuth(USER_TYPES.CLIENT)
  @ApiOkResponse({ description: 'Logged out successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request) {
    try {
      const userId = req.user.userId;
      const response = await this.authService.revokeRefreshToken(userId);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Start Google OAuth login flow' })
  @ApiOkResponse({ description: 'Redirects to Google OAuth consent page.' })
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin(): Promise<any> {
    return HttpStatus.OK;
  }

  @ApiOperation({ summary: 'Google OAuth callback endpoint' })
  @ApiOkResponse({
    description: 'Google OAuth callback processed successfully.',
  })
  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleLoginRedirect(@Req() req: Request): Promise<any> {
    return {
      statusCode: HttpStatus.OK,
      data: req.user,
    };
  }

  // update user
  @ApiOperation({ summary: 'Update user' })
  @ApiBearerAuth(USER_TYPES.CLIENT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(UpdateUserDto) },
        {
          type: 'object',
          properties: {
            image: { type: 'string', format: 'binary' },
          },
        },
      ],
    },
  })
  @ApiOkResponse({ description: 'User profile updated successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @UseGuards(JwtAuthGuard)
  @Patch('update')
  @UseInterceptors(
    FileInterceptor('image', {
      // storage: diskStorage({
      //   destination:
      //     appConfig().storageUrl.rootUrl + appConfig().storageUrl.avatar,
      //   filename: (req, file, cb) => {
      //     const randomName = Array(32)
      //       .fill(null)
      //       .map(() => Math.round(Math.random() * 16).toString(16))
      //       .join('');
      //     return cb(null, `${randomName}${file.originalname}`);
      //   },
      // }),
      storage: memoryStorage(),
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

  // --------------change password---------
  // -------change email address------
  
  @ApiOperation({ summary: 'request email change' })
  @ApiBearerAuth(USER_TYPES.CLIENT)
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', example: 'new@example.com' },
      },
    },
  })
  @ApiOkResponse({ description: 'Email change request sent successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @UseGuards(JwtAuthGuard)
  @Post('request-email-change')
  async requestEmailChange(
    @Req() req: Request,
    @Body() data: { email: string },
  ) {
    try {
      const user_id = req.user.userId;
      const email = data.email;
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.requestEmailChange(user_id, email);
    } catch (error) {
      return {
        success: false,
        message: 'Something went wrong',
      };
    }
  }

  @ApiOperation({ summary: 'Change email address' })
  @ApiBearerAuth(USER_TYPES.CLIENT)
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'token'],
      properties: {
        email: { type: 'string', example: 'new@example.com' },
        token: { type: 'string', example: '123456' },
      },
    },
  })
  @ApiOkResponse({ description: 'Email changed successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @UseGuards(JwtAuthGuard)
  @Post('change-email')
  async changeEmail(
    @Req() req: Request,
    @Body() data: { email: string; token: string },
  ) {
    try {
      const user_id = req.user.userId;
      const email = data.email;

      const token = data.token;
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      if (!token) {
        throw new HttpException('Token not provided', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.changeEmail({
        user_id: user_id,
        new_email: email,
        token: token,
      });
    } catch (error) {
      return {
        success: false,
        message: 'Something went wrong',
      };
    }
  }
  // -------end change email address------

  // --------- 2FA ---------
  @ApiOperation({ summary: 'Generate 2FA secret' })
  @ApiBearerAuth(USER_TYPES.CLIENT)
  @ApiOkResponse({ description: '2FA secret generated successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @UseGuards(JwtAuthGuard)
  @Post('generate-2fa-secret')
  async generate2FASecret(@Req() req: Request) {
    try {
      const user_id = req.user.userId;
      return await this.authService.generate2FASecret(user_id);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Verify 2FA' })
  @ApiBearerAuth(USER_TYPES.CLIENT)
  @ApiBody({
    schema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string', example: '123456' },
      },
    },
  })
  @ApiOkResponse({ description: '2FA token verified successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @UseGuards(JwtAuthGuard)
  @Post('verify-2fa')
  async verify2FA(
    @Req() req: Request, 
    @Body() data: { token: string }) {
    try {
      const user_id = req.user.userId;
      const token = data.token;
      return await this.authService.verify2FA(user_id, token);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Enable 2FA' })
  @ApiBearerAuth(USER_TYPES.CLIENT)
  @ApiOkResponse({ description: '2FA enabled successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @UseGuards(JwtAuthGuard)
  @Post('enable-2fa')
  async enable2FA(@Req() req: Request) {
    try {
      const user_id = req.user.userId;
      return await this.authService.enable2FA(user_id);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiBearerAuth(USER_TYPES.CLIENT)
  @ApiOkResponse({ description: '2FA disabled successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @UseGuards(JwtAuthGuard)
  @Post('disable-2fa')
  async disable2FA(@Req() req: Request) {
    try {
      const user_id = req.user.userId;
      return await this.authService.disable2FA(user_id);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  // --------- end 2FA ---------
}
