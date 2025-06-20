'use client';

import { useEffect } from 'react';

export default function DynamicClasses() {
    useEffect(() => {
        // Add classes only on client side
        document.documentElement.classList.add('dtwsdr', 'idc0_350', 'tvspkacfjh');
    }, []);

    return null;
}