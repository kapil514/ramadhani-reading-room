export type LeadStatus = 'NOT_INTERESTED' | 'FOLLOW_UP' | 'JOINED';
export type StudentStatus = 'ACTIVE' | 'EXPIRED' | 'PAUSED' | 'LEFT';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING';
export type GovtIdType = 'AADHAAR' | 'PAN' | 'DRIVING_LICENCE' | 'PASSPORT';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  course: string;
  enquiryDate: string;
  leadStatus: LeadStatus;
  lastFollowupDate?: string | null;
  notes?: string | null;
  convertedStudentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CabinStatus = 'VACANT' | 'OCCUPIED' | 'EXPIRING_SOON' | 'INACTIVE';
export type CabinType = 'STANDARD' | 'PREMIUM' | 'AC';
export type LockerStatus = 'VACANT' | 'OCCUPIED';

export interface CabinStudent {
  id: string;
  name: string;
  studentCode: string;
  phone: string;
}

export interface CabinMembership {
  id: string;
  startDate: string;
  endDate: string;
  paymentStatus: PaymentStatus;
  student: CabinStudent;
}

export interface Cabin {
  id: string;
  cabinNo: string;
  roomName: string;
  category: string;
  cabinType: CabinType;
  status: CabinStatus;
  currentMembershipId?: string | null;
  monthlyPrice?: number | null;
  activeMembership?: CabinMembership | null;
  createdAt: string;
}

export interface Locker {
  id: string;
  lockerNo: string;
  area: string;
  status: LockerStatus;
  currentStudentId?: string | null;
  currentStudent?: CabinStudent | null;
}

export interface Membership {
  id: string;
  studentId: string;
  startDate: string;
  endDate: string;
  cabinId?: string | null;
  lockerId?: string | null;
  paymentStatus: PaymentStatus;
  amountDue?: number | null;
  cabin?: Cabin | null;
  locker?: Locker | null;
  createdAt: string;
}

export interface Student {
  id: string;
  studentCode: string;
  name: string;
  gender?: Gender | null;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  dob?: string | null;
  address?: string | null;
  photoUrl?: string | null;
  govtIdType?: GovtIdType | null;
  govtIdNumber?: string | null;
  govtIdUrl?: string | null;
  course?: string | null;
  institution?: string | null;
  studyLevel?: string | null;
  studyHoursPerDay?: string | null;
  preferredStudyTime?: string | null;
  referralSource?: string | null;
  fingerprintId?: string | null;
  status: StudentStatus;
  enquiryId?: string | null;
  memberships?: Membership[];
  createdAt: string;
  updatedAt: string;
}
