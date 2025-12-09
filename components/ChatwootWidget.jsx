'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import CryptoJS from 'crypto-js';

const ChatwootWidget = () => {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
      } else {
        setUser(data.user);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userId = user.id;
    const userEmail = user.email;
    const userName =
      user.user_metadata?.first_name + ' ' + user.user_metadata?.last_name ||
      userEmail.split('@')[0];

    window.chatwootSettings = {
      hideMessageBubble: false,
      position: 'right',
      locale: 'en',
      type: 'standard'
    };

    const key = 'gQLxGUtTdGWhPWASETJvX5Uc'; // Replace with your actual HMAC key
    const hash = CryptoJS.HmacSHA256(userId, key).toString();

    const initChatwoot = () => {
      window.chatwootSDK.run({
        websiteToken: '7KQ2mGDK5dY4GrSdaoJqxozR',
        baseUrl: 'https://chat.mixflip.io'
      });

      setTimeout(() => {
        window.$chatwoot.setUser(userId, {
          name: userName,

          email: userEmail,
          avatar_url: '',
          identifier_hash: hash
        });

        console.log('Chatwoot user set:', {
          userId,
          userEmail,
          userName,
          hash
        });
      }, 1000);
    };

    const script = document.createElement('script');
    script.src = 'https://chat.mixflip.io/packs/js/sdk.js';
    script.async = true;
    script.onload = initChatwoot;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [user]);

  return null;
};

export default ChatwootWidget;
