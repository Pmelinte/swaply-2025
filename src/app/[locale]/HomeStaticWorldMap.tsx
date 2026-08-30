export default function HomeStaticWorldMap() {
  return (
    <div
      className="pointer-events-none absolute right-[2.5%] top-[17%] z-20 hidden h-[58%] w-[68%] lg:block"
      aria-hidden="true"
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/2/29/Blank_world_map_%28green_color%29.svg"
        alt=""
        className="h-full w-full object-contain"
        draggable={false}
      />
    </div>
  );
}
