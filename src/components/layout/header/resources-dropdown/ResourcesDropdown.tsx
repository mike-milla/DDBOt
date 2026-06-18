import { useMemo, useRef, useState } from 'react';
import { standalone_routes } from '@/components/shared';
import { getActiveTabUrl } from '@/utils/getActiveTabUrl';
import { LANGUAGES } from '@/utils/languages';
import { LegacyDerivIcon, LegacyHelpCentreIcon, LegacyWhatsappIcon } from '@deriv/quill-icons/Legacy';
import { useTranslations } from '@deriv-com/translations';
import { ContextMenu, DesktopLanguagesModal } from '@deriv-com/ui';
import { URLConstants } from '@deriv-com/utils';
import './resources-dropdown.scss';

const ResourcesDropdown = () => {
    const { currentLang = 'EN', localize, switchLanguage } = useTranslations();
    const [is_open, setIsOpen] = useState(false);
    const [is_lang_modal_open, setIsLangModalOpen] = useState(false);
    const wrapper_ref = useRef<HTMLDivElement>(null);

    const countryIcon = useMemo(
        () => LANGUAGES.find(({ code }: { code: string }) => code === currentLang)?.placeholderIcon,
        [currentLang]
    );

    const toggleDropdown = () => setIsOpen(prev => !prev);
    const closeDropdown = () => setIsOpen(false);

    return (
        <div className='resources-dropdown' ref={wrapper_ref}>
            <button
                className={`resources-dropdown__trigger${is_open ? ' resources-dropdown__trigger--active' : ''}`}
                onClick={toggleDropdown}
                aria-haspopup='true'
                aria-expanded={is_open}
                title={localize('Resources')}
            >
                <svg
                    width='18'
                    height='18'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                >
                    <circle cx='12' cy='12' r='1' />
                    <circle cx='12' cy='5' r='1' />
                    <circle cx='12' cy='19' r='1' />
                </svg>
            </button>

            {is_open && <div className='resources-dropdown__backdrop' onClick={closeDropdown} />}

            <ContextMenu isOpen={is_open}>
                <button
                    className='resources-dropdown__item'
                    onClick={() => {
                        closeDropdown();
                        setIsLangModalOpen(true);
                    }}
                >
                    <span className='resources-dropdown__item-icon'>{countryIcon}</span>
                    <span className='resources-dropdown__item-label'>{localize('Language')}</span>
                    <span className='resources-dropdown__item-value'>{currentLang}</span>
                </button>

                <a
                    className='resources-dropdown__item'
                    href={standalone_routes.help_center}
                    target='_blank'
                    rel='noreferrer'
                    onClick={closeDropdown}
                >
                    <span className='resources-dropdown__item-icon'>
                        <LegacyHelpCentreIcon iconSize='xs' />
                    </span>
                    <span className='resources-dropdown__item-label'>{localize('Help centre')}</span>
                </a>

                <a
                    className='resources-dropdown__item'
                    href={URLConstants.whatsApp}
                    target='_blank'
                    rel='noreferrer'
                    onClick={closeDropdown}
                >
                    <span className='resources-dropdown__item-icon'>
                        <LegacyWhatsappIcon iconSize='xs' />
                    </span>
                    <span className='resources-dropdown__item-label'>{localize('WhatsApp')}</span>
                </a>

                <a
                    className='resources-dropdown__item'
                    href={standalone_routes.deriv_com}
                    target='_blank'
                    rel='noreferrer'
                    onClick={closeDropdown}
                >
                    <span className='resources-dropdown__item-icon'>
                        <LegacyDerivIcon iconSize='xs' />
                    </span>
                    <span className='resources-dropdown__item-label'>{localize('deriv.com')}</span>
                </a>
            </ContextMenu>

            {is_lang_modal_open && (
                <DesktopLanguagesModal
                    headerTitle={localize('Select Language')}
                    isModalOpen
                    languages={LANGUAGES}
                    onClose={() => setIsLangModalOpen(false)}
                    onLanguageSwitch={code => {
                        switchLanguage(code);
                        setIsLangModalOpen(false);
                        window.location.replace(getActiveTabUrl());
                        window.location.reload();
                    }}
                    selectedLanguage={currentLang}
                />
            )}
        </div>
    );
};

export default ResourcesDropdown;
