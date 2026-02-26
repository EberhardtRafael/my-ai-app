'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AssistantExperience from '@/app/assistant/components/AssistantExperience';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useLocalization } from '@/contexts/LocalizationContext';

export default function AssistantFloatingWidget() {
  const { data: session } = useSession();
  const { t } = useLocalization();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const mediaQuery = window.matchMedia('(max-width: 640px)');

    const syncViewportState = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);
      if (!mobile) {
        setIsCollapsed(false);
      }
    };

    syncViewportState();
    mediaQuery.addEventListener('change', syncViewportState);

    return () => {
      mediaQuery.removeEventListener('change', syncViewportState);
    };
  }, []);

  const handleToggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsCollapsed(false);
      }
      return next;
    });
  };

  if (!session || pathname === '/assistant' || !isMounted) {
    return null;
  }

  return (
    <>
      {isOpen &&
        createPortal(
          <div className="fixed right-4 sm:right-6 z-[70] bottom-[calc(env(safe-area-inset-bottom)+1rem)] sm:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] pointer-events-auto">
            <Card
              className={`p-0 overflow-hidden flex flex-col min-h-0 [&>div]:flex-1 [&>div]:min-h-0 w-[24rem] md:w-[30rem] lg:w-[34rem] max-w-[calc(100vw-2rem)] h-[72vh] lg:h-[78vh] max-h-[48rem] ${
                isMobile ? 'w-[calc(100vw-1rem)] h-[70dvh] max-h-[40rem]' : ''
              } ${isCollapsed ? 'h-auto max-h-none' : ''}`}
            >
              <div className="h-full flex flex-col bg-gray-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-900">{t('assistant.title')}</h2>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      className="px-2 py-1"
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/assistant');
                      }}
                    >
                      {t('assistant.openPage')}
                    </Button>
                    {isMobile && (
                      <Button
                        variant="ghost"
                        className="px-2 py-1"
                        onClick={() => setIsCollapsed((prev) => !prev)}
                      >
                        {isCollapsed ? t('assistant.expand') : t('assistant.collapse')}
                      </Button>
                    )}
                    <Button variant="ghost" className="px-2 py-1" onClick={() => setIsOpen(false)}>
                      {t('assistant.close')}
                    </Button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <AssistantExperience mode="floating" />
                  </div>
                )}
              </div>
            </Card>
          </div>,
          document.body
        )}

      {!isOpen && (
        <div className="fixed right-4 sm:right-6 z-[60] bottom-[calc(env(safe-area-inset-bottom)+1rem)] sm:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          <Button
            onClick={handleToggleOpen}
            variant="primary"
            className="px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base rounded-full shadow"
          >
            {t('common.assistant')}
          </Button>
        </div>
      )}
    </>
  );
}
