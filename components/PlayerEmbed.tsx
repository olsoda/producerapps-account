import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon, CopyIcon } from 'lucide-react';

interface PlayerEmbedProps {
  publicPath: string;
}

const PlayerEmbed: React.FC<PlayerEmbedProps> = ({ publicPath }) => {
  const [isCopied, setIsCopied] = useState(false);

  const embedCode = `<iframe src="https://mixflip.producerapps.com/players/${publicPath}" width="100%" height="380" frameborder="0" id="mixflip-player-iframe-${publicPath}"></iframe><script defer src="https://mixflip.producerapps.com/embed-resize.js?id=${publicPath}"></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div>
      {/* <h2 className="mb-2 text-lg font-bold">Embed Your Player:</h2>
      <p className="mb-4 text-sm text-gray-600">
        Copy and paste this code where you want the player to appear on your
        website:
      </p> */}
      <div className="relative">
        <pre className="p-4 pr-20 overflow-x-auto text-xs break-all whitespace-pre-wrap bg-muted rounded-md">
          {embedCode}
        </pre>
        <Button
          className="absolute top-2 right-2"
          size="sm"
          variant={isCopied ? 'default' : 'outline'}
          onClick={copyToClipboard}
        >
          {isCopied ? (
            <>
              <CheckIcon className="w-4 h-4" />
            </>
          ) : (
            <>
              <CopyIcon className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PlayerEmbed;
