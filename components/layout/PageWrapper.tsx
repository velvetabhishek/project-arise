'use client';
// components/layout/PageWrapper.tsx
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
};

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <div className="arise-page">
      <Sidebar />
      <TopBar />
      <main
        className={`arise-content ${className}`}
        style={{ paddingLeft: 'max(20px, 4vw)', paddingRight: 'max(20px, 4vw)' }}
      >
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
