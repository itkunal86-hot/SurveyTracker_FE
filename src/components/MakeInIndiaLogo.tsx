interface MakeInIndiaLogoProps {
  className?: string;
  size?: number;
}

export const MakeInIndiaLogo = ({
  className = "",
  size = 120,
}: MakeInIndiaLogoProps) => {
  return (
    <div className={`${className}`}>
      <img
        src="https://cdn.builder.io/api/v1/image/assets%2F61ffc8c885ae427dbb531b91af5e726b%2F36da94c475974a86baa4ca808a5e7d64?format=webp&width=800"
        alt="Make in India - Official Logo"
        width={size}
        height={size * 0.6}
        className="drop-shadow-lg object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
        style={{
          filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
        }}
      />
    </div>
  );
};
