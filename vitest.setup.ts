// Tests read .env.test locally. In CI the variables come from the workflow instead,
// and dotenv never overrides variables that are already set.
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })
