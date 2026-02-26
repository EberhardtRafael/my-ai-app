'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import Textarea from '@/components/ui/Textarea';
import Toast from '@/components/ui/Toast';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/components/ui/useToast';

type ProfileFormState = {
  fullName: string;
  phone: string;
  location: string;
  about: string;
};

type DevModeState = {
  enabled: boolean;
  available: boolean;
  forced: boolean;
  role?: 'user' | 'dev';
};

const EMPTY_PROFILE: ProfileFormState = {
  fullName: '',
  phone: '',
  location: '',
  about: '',
};

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const { t } = useLocalization();
  const toast = useToast();
  const { profileData, setProfileData, isProfileReady } = useProfile();

  const [formState, setFormState] = useState<ProfileFormState>(EMPTY_PROFILE);
  const [devModeState, setDevModeState] = useState<DevModeState>({
    enabled: false,
    available: false,
    forced: false,
    role: 'user',
  });
  const [devAccessCode, setDevAccessCode] = useState('');
  const [isUpgradingRole, setIsUpgradingRole] = useState(false);

  useEffect(() => {
    const loadDevModeState = async () => {
      try {
        const response = await fetch('/api/dev/mode', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as DevModeState;
        setDevModeState(payload);
      } catch {
        setDevModeState({ enabled: false, available: false, forced: false, role: 'user' });
      }
    };

    loadDevModeState();
  }, []);

  useEffect(() => {
    setFormState(profileData);
  }, [profileData]);

  const permissionRows = useMemo(
    () => [
      {
        label: t('profile.permissions.toggleDevMode'),
        value: devModeState.available ? t('profile.permissions.allowed') : t('profile.permissions.denied'),
      },
      {
        label: t('profile.permissions.accessTickets'),
        value: devModeState.enabled ? t('profile.permissions.allowed') : t('profile.permissions.denied'),
      },
      {
        label: t('profile.permissions.accessTestingLab'),
        value: devModeState.enabled ? t('profile.permissions.allowed') : t('profile.permissions.denied'),
      },
    ],
    [devModeState.available, devModeState.enabled, t]
  );

  const handleFieldChange = (field: keyof ProfileFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!session?.user?.id) {
      return;
    }

    setProfileData(formState);

    if (formState.fullName.trim()) {
      await update({
        ...session,
        user: {
          ...session.user,
          name: formState.fullName.trim(),
        },
      });
    }

    toast.success(t('profile.toasts.savedTitle'), t('profile.toasts.savedMessage'));
  };

  const handleUpgradeToDev = async () => {
    if (!devAccessCode.trim()) {
      toast.error(t('profile.toasts.invalidDevCodeTitle'), t('profile.toasts.invalidDevCodeMessage'));
      return;
    }

    setIsUpgradingRole(true);

    try {
      const response = await fetch('/api/auth/dev-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devAccessCode: devAccessCode.trim() }),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(
          t('profile.toasts.invalidDevCodeTitle'),
          payload?.error || t('profile.toasts.invalidDevCodeMessage')
        );
        return;
      }

      await update({
        ...session,
        user: {
          ...session?.user,
          role: 'dev',
        },
      });

      setDevAccessCode('');
      toast.success(t('profile.toasts.roleUpdatedTitle'), t('profile.toasts.roleUpdatedMessage'));
      window.location.reload();
    } finally {
      setIsUpgradingRole(false);
    }
  };

  if (status === 'loading' || !isProfileReady) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <LoadingSpinner message={t('profile.loading')} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader title={t('profile.title')} description={t('profile.description')} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            header={<h2 className="text-xl font-semibold text-gray-900">{t('profile.form.title')}</h2>}
            footer={
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>{t('profile.form.saveButton')}</Button>
              </div>
            }
          >
            <div className="space-y-4">
              <Input
                id="profile-full-name"
                label={t('profile.form.fullName')}
                value={formState.fullName}
                onChange={(event) => handleFieldChange('fullName', event.target.value)}
                placeholder={t('profile.form.fullNamePlaceholder')}
              />
              <Input
                id="profile-email"
                label={t('profile.form.email')}
                value={session?.user?.email || ''}
                disabled
              />
              <Input
                id="profile-phone"
                label={t('profile.form.phone')}
                value={formState.phone}
                onChange={(event) => handleFieldChange('phone', event.target.value)}
                placeholder={t('profile.form.phonePlaceholder')}
              />
              <Input
                id="profile-location"
                label={t('profile.form.location')}
                value={formState.location}
                onChange={(event) => handleFieldChange('location', event.target.value)}
                placeholder={t('profile.form.locationPlaceholder')}
              />
              <Textarea
                id="profile-about"
                label={t('profile.form.about')}
                value={formState.about}
                onChange={(event) => handleFieldChange('about', event.target.value)}
                placeholder={t('profile.form.aboutPlaceholder')}
                rows={4}
              />
            </div>
          </Card>

          <Card header={<h2 className="text-xl font-semibold text-gray-900">{t('profile.status.title')}</h2>}>
            <div className="space-y-4">
              <div className="grid grid-cols-[170px_1fr] gap-2 text-sm">
                <p className="text-gray-600">{t('profile.status.userId')}</p>
                <p className="font-medium text-gray-900">{session?.user?.id}</p>
                <p className="text-gray-600">{t('profile.status.role')}</p>
                <p className="font-medium text-gray-900 uppercase">{session?.user?.role || 'user'}</p>
                <p className="text-gray-600">{t('profile.status.account')}</p>
                <p className="font-medium text-gray-900">{t('profile.status.active')}</p>
                <p className="text-gray-600">{t('profile.status.devMode')}</p>
                <p className="font-medium text-gray-900">
                  {devModeState.enabled ? t('profile.status.enabled') : t('profile.status.disabled')}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  {t('profile.permissions.title')}
                </h3>
                <div className="space-y-2">
                  {permissionRows.map((permission) => (
                    <div
                      key={permission.label}
                      className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-3 py-2"
                    >
                      <span className="text-sm text-gray-700">{permission.label}</span>
                      <span className="text-sm font-medium text-gray-900">{permission.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {(session?.user?.role || 'user') !== 'dev' && (
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    {t('profile.permissions.unlockDevTitle')}
                  </h3>
                  <Input
                    id="profile-dev-access-code"
                    label={t('profile.permissions.unlockDevCodeLabel')}
                    value={devAccessCode}
                    onChange={(event) => setDevAccessCode(event.target.value)}
                    placeholder={t('profile.permissions.unlockDevCodePlaceholder')}
                  />
                  <Button onClick={handleUpgradeToDev} disabled={isUpgradingRole}>
                    {isUpgradingRole
                      ? t('profile.permissions.unlockDevSubmitting')
                      : t('profile.permissions.unlockDevButton')}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      {toast.toasts.map((toastItem) => (
        <Toast
          key={toastItem.id}
          title={toastItem.title}
          message={toastItem.message}
          type={toastItem.type}
          duration={toastItem.duration}
          action={toastItem.action}
          onClose={() => toast.removeToast(toastItem.id)}
        />
      ))}
    </main>
  );
}
