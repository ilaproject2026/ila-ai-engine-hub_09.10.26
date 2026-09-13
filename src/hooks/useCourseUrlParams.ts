import { useEffect, useState, useRef } from 'react';

export interface InboundCourseParams {
  courseName: string;
  category?: string;
  subCategory?: string;
  topTitle?: string;
  chapters?: string;
  duration?: string;
  staff?: string;
  fee?: string;
  methods?: string;
  pathName?: string;
  batchName?: string;
  courseStructure?: string;
  compositeId?: string;
  autoGenerate: boolean;
  returnUrl?: string;
}

export function useCourseUrlParams() {
  const [inboundParams, setInboundParams] = useState<InboundCourseParams | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      let courseName = searchParams.get('courseName') || searchParams.get('title');

      let paramsSource = searchParams;
      if (!courseName && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        paramsSource = new URLSearchParams(hashQuery);
        courseName = paramsSource.get('courseName') || paramsSource.get('title');
      }

      if (!courseName) {
        // Check if there is a cached returnUrl from a previous inbound load
        const cachedReturnUrl = sessionStorage.getItem('ila_admin_portal_return_url');
        if (cachedReturnUrl) {
          // Keep returnUrl available even if courseName was already consumed in previous session
        }
        return;
      }

      const rawReturnUrl = paramsSource.get('returnUrl')
        ? decodeURIComponent(paramsSource.get('returnUrl')!)
        : sessionStorage.getItem('ila_admin_portal_return_url') || undefined;

      if (rawReturnUrl) {
        sessionStorage.setItem('ila_admin_portal_return_url', rawReturnUrl);
      }

      const params: InboundCourseParams = {
        courseName: decodeURIComponent(courseName),
        category: paramsSource.get('category') ? decodeURIComponent(paramsSource.get('category')!) : undefined,
        subCategory: paramsSource.get('subCategory') ? decodeURIComponent(paramsSource.get('subCategory')!) : undefined,
        topTitle: paramsSource.get('topTitle') ? decodeURIComponent(paramsSource.get('topTitle')!) : undefined,
        chapters: paramsSource.get('chapters') || undefined,
        duration: paramsSource.get('duration') ? decodeURIComponent(paramsSource.get('duration')!) : undefined,
        staff: paramsSource.get('staff') ? decodeURIComponent(paramsSource.get('staff')!) : undefined,
        fee: paramsSource.get('fee') || undefined,
        methods: paramsSource.get('methods') ? decodeURIComponent(paramsSource.get('methods')!) : undefined,
        pathName: paramsSource.get('pathName') ? decodeURIComponent(paramsSource.get('pathName')!) : undefined,
        batchName: paramsSource.get('batchName') ? decodeURIComponent(paramsSource.get('batchName')!) : undefined,
        courseStructure: paramsSource.get('courseStructure') ? decodeURIComponent(paramsSource.get('courseStructure')!) : undefined,
        compositeId: paramsSource.get('compositeId') || undefined,
        autoGenerate: paramsSource.get('autoGenerate') === 'true',
        returnUrl: rawReturnUrl,
      };

      processedRef.current = true;
      setInboundParams(params);

      // Clean the URL query params without triggering a reload to keep browser history tidy
      const cleanUrl = window.location.pathname + (window.location.hash.includes('?') ? window.location.hash.split('?')[0] : window.location.hash);
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (err) {
      console.error('Failed to parse inbound course URL parameters:', err);
    }
  }, []);

  return inboundParams;
}
