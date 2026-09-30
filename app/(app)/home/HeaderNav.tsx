"use client";
import { useState } from "react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import ProfileModal from "./ProfileModal";

interface HeaderNavProps {
  fullName: string;
  email: string;
  roleName: string;
}

export default function HeaderNav({ fullName, email, roleName }: HeaderNavProps) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      {/* Right side: Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/home/users"
          className="px-4 py-2 rounded-lg border border-sky-500/50 hover:bg-sky-500/20 text-sky-300 font-medium transition-colors"
        >
          Usuarios
        </Link>
        <Link
          href="/home/invitations"
          className="px-4 py-2 rounded-lg border border-sky-500/50 hover:bg-sky-500/20 text-sky-300 font-medium transition-colors"
        >
          Invitaciones
        </Link>
        <button
          onClick={() => setShowProfile(true)}
          className="px-4 py-2 rounded-lg border border-sky-500/50 hover:bg-sky-500/20 text-sky-300 font-medium transition-colors"
        >
          Perfil
        </button>
        <LogoutButton />
      </div>

      {/* Modal de Perfil */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
}
