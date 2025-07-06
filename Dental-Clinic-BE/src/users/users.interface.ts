export type UserRole = 'Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Accountant';

export interface UserPayload {
    userId: number;
    username: string;
    role: UserRole;
    isActive: boolean;
}
