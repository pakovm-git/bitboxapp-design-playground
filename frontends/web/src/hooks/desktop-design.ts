// SPDX-License-Identifier: Apache-2.0

import { useSyncExternalStore } from 'react';
import { desktopDesignSnapshot, subscribeDesktopDesign } from '@/utils/desktop-design';

export const useDesktopDesign = () => useSyncExternalStore(subscribeDesktopDesign, desktopDesignSnapshot);
