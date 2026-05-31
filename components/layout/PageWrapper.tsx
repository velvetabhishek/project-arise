'use client';
// components/layout/PageWrapper.tsx — Production-stable layout shell
// Fixes: double arise-page, padding conflicts, sidebar-offset sync
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    // NOTE: body already has arise-page + arise-grid-bg from root layout.
    // PageWrapper does NOT re-add arise-page to avoid double min-height stacking.
    <>
      <Sidebar />
      <TopBar />
      <main className={`arise-content ${className}`}>
        <motion.div
          className="page-inner"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
    </>
  );
}
