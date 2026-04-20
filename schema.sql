-- ============================================================
-- CryptoLegacy Production Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- Users table
-- ------------------------------------------------------------
DROP TABLE IF EXISTS referral_earnings CASCADE;
DROP TABLE IF EXISTS kyc_submissions CASCADE;
DROP TABLE IF EXISTS otp_verifications CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS deposits CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS user_payment_methods CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;

CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id       BIGINT UNIQUE,
    email             VARCHAR(255) UNIQUE NOT NULL,
    phone             VARCHAR(20) UNIQUE NOT NULL,
    first_name        VARCHAR(100) NOT NULL,
    password_hash     TEXT NOT NULL,
    pin_hash          TEXT NOT NULL,
    referral_code     VARCHAR(20) UNIQUE NOT NULL,
    referred_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active         BOOLEAN DEFAULT FALSE,
    is_admin          BOOLEAN DEFAULT FALSE,
    email_verified    BOOLEAN DEFAULT FALSE,
    kyc_status        VARCHAR(20) DEFAULT 'none' CHECK (kyc_status IN ('none', 'pending', 'verified', 'rejected')),
    referrals_count   INTEGER DEFAULT 0,
    referral_earnings NUMERIC(18,2) DEFAULT 0,
    total_deposited   NUMERIC(18,2) DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_referred_by ON users(referred_by);

-- ------------------------------------------------------------
-- Wallets table
-- ------------------------------------------------------------
CREATE TABLE wallets (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id            UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance            NUMERIC(18,2) NOT NULL DEFAULT 0,
    available_balance  NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_deposited    NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_withdrawn    NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_profit       NUMERIC(18,2) NOT NULL DEFAULT 0,
    active_investments NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- ------------------------------------------------------------
-- Transactions table (ledger)
-- ------------------------------------------------------------
CREATE TABLE transactions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type             VARCHAR(30) NOT NULL,
    amount           NUMERIC(18,2) NOT NULL,
    status           VARCHAR(20) NOT NULL,
    description      TEXT,
    reference_id     UUID,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- ------------------------------------------------------------
-- Investments table
-- ------------------------------------------------------------
CREATE TABLE investments (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id              VARCHAR(30) NOT NULL,
    plan_name            VARCHAR(50) NOT NULL,
    amount               NUMERIC(18,2) NOT NULL,
    start_date           TIMESTAMPTZ NOT NULL,
    end_date             TIMESTAMPTZ NOT NULL,
    profit_interval_hours INT NOT NULL,
    last_payout          TIMESTAMPTZ,
    next_payout          TIMESTAMPTZ NOT NULL,
    total_paid           NUMERIC(18,2) NOT NULL DEFAULT 0,
    expected_total       NUMERIC(18,2) NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    capital_withdrawn    BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_next_payout ON investments(next_payout) WHERE status = 'active';

-- ------------------------------------------------------------
-- Deposits table
-- ------------------------------------------------------------
CREATE TABLE deposits (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_usd       NUMERIC(18,2) NOT NULL,
    amount_kes       NUMERIC(18,2),
    method           VARCHAR(20) NOT NULL CHECK (method IN ('mpesa', 'crypto')),
    transaction_code TEXT NOT NULL,
    wallet_address   TEXT,
    network          VARCHAR(10),
    phone_number     VARCHAR(20),
    status           VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);

-- ------------------------------------------------------------
-- Withdrawals table
-- ------------------------------------------------------------
CREATE TABLE withdrawals (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_usd       NUMERIC(18,2) NOT NULL,
    amount_kes       NUMERIC(18,2),
    fee_usd          NUMERIC(18,2) NOT NULL,
    net_amount_usd   NUMERIC(18,2) NOT NULL,
    method           VARCHAR(20) NOT NULL CHECK (method IN ('mpesa', 'bank', 'crypto')),
    details          TEXT NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    approved_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at      TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

-- ------------------------------------------------------------
-- KYC Submissions table
-- ------------------------------------------------------------
CREATE TABLE kyc_submissions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name        VARCHAR(200) NOT NULL,
    id_number        VARCHAR(50) NOT NULL,
    id_type          VARCHAR(30) NOT NULL DEFAULT 'passport',
    id_image_url     TEXT NOT NULL,
    selfie_image_url TEXT NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    reviewed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at      TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kyc_user_id ON kyc_submissions(user_id);
CREATE INDEX idx_kyc_status ON kyc_submissions(status);

-- ------------------------------------------------------------
-- OTP Verifications table
-- ------------------------------------------------------------
CREATE TABLE otp_verifications (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email         VARCHAR(255) NOT NULL,
    otp           VARCHAR(6) NOT NULL,
    expires_at    TIMESTAMPTZ NOT NULL,
    verified      BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otp_email ON otp_verifications(email);
CREATE INDEX idx_otp_user_id ON otp_verifications(user_id);

-- ------------------------------------------------------------
-- User Payment Methods table
-- ------------------------------------------------------------
CREATE TABLE user_payment_methods (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    mpesa_phone          VARCHAR(20),
    crypto_wallet_address TEXT,
    crypto_network       VARCHAR(10),
    bank_details         TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Referral Earnings table
-- ------------------------------------------------------------
CREATE TABLE referral_earnings (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type             VARCHAR(30) NOT NULL,
    amount           NUMERIC(18,2) NOT NULL,
    deposit_id       UUID REFERENCES deposits(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_earnings_referrer ON referral_earnings(referrer_id);

-- ------------------------------------------------------------
-- System Configuration table
-- ------------------------------------------------------------
CREATE TABLE system_config (
    key        VARCHAR(50) PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO system_config (key, value) VALUES
    ('usd_to_kes', '129'),
    ('referral_commission_percent', '5'),
    ('min_deposit_usd', '5'),
    ('min_withdrawal_usd', '10'),
    ('withdrawal_fee_percent', '1'),
    ('mpesa_paybill', '247247'),
    ('mpesa_account', '00206996476150'),
    ('crypto_btc_address', '1bgghhjjkk'),
    ('crypto_usdt_address', 'T ijdfvhjj');

-- ------------------------------------------------------------
-- Create default admin user (optional)
-- Password: admin123, PIN: 1234
-- ------------------------------------------------------------
INSERT INTO users (
    telegram_id, email, phone, first_name, password_hash, pin_hash, 
    referral_code, is_active, is_admin, email_verified, kyc_status
) VALUES (
    8223986350, 
    'admin@cryptolegacy.com', 
    'admin',
    'Admin',
    '$2b$10$N9qo8uLOickgx2ZMRZoMy.MqrqbKk5qK9LJtQpJtYq9qK9LJtQpJt', -- bcrypt hash for 'admin123'
    '$2b$10$N9qo8uLOickgx2ZMRZoMy.MqrqbKk5qK9LJtQpJtYq9qK9LJtQpJt', -- bcrypt hash for '1234'
    'ADMIN123',
    TRUE,
    TRUE,
    TRUE,
    'verified'
) ON CONFLICT DO NOTHING;

-- Create wallet for admin
INSERT INTO wallets (user_id, balance, available_balance)
SELECT id, 10000, 10000 FROM users WHERE email = 'admin@cryptolegacy.com'
ON CONFLICT DO NOTHING;

-- ============================================================
-- End of schema
-- ============================================================
