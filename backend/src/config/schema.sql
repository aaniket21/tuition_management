CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'STUDENT', 'PARENT', 'TEACHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    status user_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
    student_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    documents JSONB
);

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    batch_name VARCHAR(100),
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    max_students INT DEFAULT 40,
    start_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    monthly_fee DECIMAL(10, 2) DEFAULT 0.00,
    admission_fee DECIMAL(10, 2) DEFAULT 0.00,
    late_fee_penalty DECIMAL(10, 2) DEFAULT 0.00,
    schedule_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE(student_id, class_id)
);

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    marked_by UUID REFERENCES users(id),
    UNIQUE(class_id, student_id, date)
);

DO $$ BEGIN
    CREATE TYPE fee_status AS ENUM ('ACTIVE', 'OVERDUE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS fee_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    monthly_amount DECIMAL(10, 2) NOT NULL,
    status fee_status DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS offline_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_plan_id UUID REFERENCES fee_plans(id) ON DELETE CASCADE,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by UUID REFERENCES users(id),
    receipt_url VARCHAR(255)
);

DO $$ BEGIN
    CREATE TYPE notice_audience AS ENUM ('GLOBAL', 'CLASS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    audience notice_audience NOT NULL,
    target_class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    attachment_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    notice_id UUID REFERENCES notices(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);
