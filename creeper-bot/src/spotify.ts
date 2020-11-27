import axios from 'axios';
import { createQueryString } from './http';


export async function getSpotifyAccessCode(): Promise<string> {
  const config = {
    headers: {
      'Authorization': `Basic ${process.env.SPOTIFY_SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  const formData = {
    'grant_type': 'client_credentials'
  };
  return (await axios.post('https://accounts.spotify.com/api/token', createQueryString(formData), config)).data.access_token;
}

export async function getSpotifyTracksByPlaylist(playlistId: string, accessToken: string): Promise<string[]> {
  const data = (await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })).data as any;

  return data.items.slice(0, 100).filter((item: any) => !!item.track?.name).map((item: any) => {
    const artists = item.track.artists?.map((artist: any) => artist.name).join(" ");
    return `${item.track.name} ${artists ?? ''}`;
  });
}
