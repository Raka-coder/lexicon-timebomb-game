import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

interface BreadcrumbSegment {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface Props {
  segments: BreadcrumbSegment[];
  className?: string;
}

export function AppBreadcrumb({ segments, className }: Props) {
  return (
    <Breadcrumb className={cn("", className)}>
      <BreadcrumbList className="flex-nowrap gap-1 text-[10px] font-black uppercase tracking-widest">
        {segments.map((segment, i) => {
          const isLast = i === segments.length - 1;
          return (
            <BreadcrumbItem key={`${segment.label}-${i}`}>
              {isLast ? (
                <BreadcrumbPage className="text-primary text-[10px] font-black uppercase tracking-widest">
                  {segment.label}
                </BreadcrumbPage>
              ) : segment.onClick ? (
                <button
                  onClick={segment.onClick}
                  className="text-white/30 hover:text-white transition-colors"
                >
                  <BreadcrumbLink className="text-[10px] font-black uppercase tracking-widest text-inherit hover:text-inherit cursor-pointer">
                    {segment.label}
                  </BreadcrumbLink>
                </button>
              ) : (
                <BreadcrumbLink
                  href={segment.href}
                  className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                >
                  {segment.label}
                </BreadcrumbLink>
              )}
              {!isLast && (
                <BreadcrumbSeparator className="text-white/20 [&>svg]:size-3" />
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
