"use client";

export function RecordingPlayer({ id, title }: { id: string; title: string }) {
  return <div className="mt-3"><video
    controls playsInline preload="none" controlsList="nodownload noremoteplayback"
    disablePictureInPicture disableRemotePlayback
    onContextMenu={event => event.preventDefault()}
    className="aspect-video w-full rounded-xl bg-black"
    aria-label={title}
  ><source src={`/api/class-resources/${id}`} type="video/mp4" />Your browser does not support this recording.</video></div>;
}
