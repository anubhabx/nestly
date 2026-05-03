import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private users: Map<number, any> = new Map();
  private counter: number = 1;

  async create(createUserDto: CreateUserDto): Promise<any> {
    // Check if user already exists
    const existingUser = Array.from(this.users.values()).find(
      (u) => u.email === createUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = {
      id: this.counter++,
      ...createUserDto,
      password: hashedPassword,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(newUser.id, newUser);
    return { ...newUser, password: undefined };
  }

  async findAll(): Promise<any[]> {
    const users = Array.from(this.users.values());
    return users.map(({ password, ...user }) => user);
  }

  async findOne(id: number): Promise<any> {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const { password, ...result } = user;
    return result;
  }

  async findByEmail(email: string): Promise<any> {
    const user = Array.from(this.users.values()).find((u) => u.email === email);
    return user || null;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<any> {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    Object.assign(user, updateUserDto);

    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    user.updatedAt = new Date();

    this.users.set(id, user);
    const { password, ...result } = user;
    return result;
  }

  async remove(id: number): Promise<void> {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    this.users.delete(id);
  }
}
