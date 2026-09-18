import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Kept as a union so tRPC infers the exact literals on the client. */
export type Gender = 'male' | 'female' | 'other';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  // Nullable so `synchronize: true` can add these columns to a table that
  // already has rows. New users always supply them (see the create schemas).
  @Column({ type: 'varchar', nullable: true })
  gender: Gender | null;

  @Column({ type: 'varchar', nullable: true })
  profession: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;
}
