export class CreateTaskDto {
  title: string;
  description?: string;

  priority?:
    | 'UNBREAK_NOW'
    | 'NEEDS_TRIAGE'
    | 'HIGH'
    | 'NORMAL'
    | 'LOW'
    | 'WISHLIST';

  status?: 'OPEN' | 'RESOLVED' | 'WONT_FIX' | 'INVALID' | 'SPITE';

  visibility?: 'ALL_USERS' | 'CUSTOM';

  createdById: number;
  assignedToId?: number;
  parentTaskId?: number;
}