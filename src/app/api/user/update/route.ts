import { AuthOptions } from "@/lib/auth";
import { connectionToDatabase } from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

interface UserInfoI {
  userId: string;
  name?: string;
  username?: string;
  bio?: string;
  profilePicUrl?: string;
  socialLinks?: string[];
}

export async function PATCH(req: Request) {
  try {
    if (req.method !== "PATCH") {
      return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
    }

    await connectionToDatabase();

    const session = await getServerSession(AuthOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body: UserInfoI = await req.json();
    const { userId, name, username, bio, profilePicUrl, socialLinks } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (session.user.id !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update only provided fields
    if (name) user.name = name;
    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (profilePicUrl !== undefined) user.profilePicUrl = profilePicUrl;

    if (socialLinks !== undefined) {
      if (!Array.isArray(socialLinks)) {
        return NextResponse.json({ error: "socialLinks must be an array" }, { status: 400 });
      }
      user.socialLinks = socialLinks;
    }

    await user.save();

    return NextResponse.json({ message: "Profile updated successfully" },{ status: 201 });

  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
